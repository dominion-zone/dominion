module dominion_governance::proposal {
    use std::string::String;
    use sui::url::Url;
    use sui::bag::{Self, Bag};
    use sui::clock::Clock;
    use sui::event;

    use dominion::command::Command;
    use dominion::executor::Executor;
    use dominion::dominion::Dominion;

    use dominion_governance::governance::Governance;

    const EInvalidVoteFormat: u64 = 0;
    const EVotingIsNotStarted: u64 = 1;
    const EAlreadyFinalized: u64 = 2;
    const ETooLateToVote: u64 = 3;
    const ETooEarlyToFinalize: u64 = 4;
    const EAlreadyStarted: u64 = 5;
    const EInvalidOwnerCap: u64 = 6;
    const ENotExecutable: u64 = 7;
    const ENotFinalized: u64 = 8;
    const EProposalFailed: u64 = 9;
    const EAlreadyExecuted: u64 = 10;
    const EAlreadyExecuting: u64 = 11;
    const EWrongGovernance: u64 = 12;
    const EWrongProposalExecutor: u64 = 13;
    const EWrongCommand: u64 = 14;
    const ETooEarlyToExecute: u64 = 15;

    public struct ProposalOwnerCap has key, store {
        id: UID,
        proposal_id: ID,
        locked_weight: u64,
    }

    public struct ProposalOption has store {
        label: String,
        details: Bag,
        commands: vector<Command>,
        vote_weight: u64,
        executed_command_count: u64,
    }

    public struct ProposalResult has store {
        finalized_at: u64,
        option_index: Option<u64>,
        executed_at: Option<u64>,
    }

    public struct Proposal<phantom T> has key {
        id: UID,
        governance_id: ID,
        owner_cap_id: ID,
        name: String,
        link: Url,
        details: Bag,
        options: vector<ProposalOption>,
        total_options_vote_weight: u64,
        deny_vote_weight: u64,
        abstain_vote_weight: u64,
        vote_threshold: u64,
        created_at: u64,
        voting_at: Option<u64>,
        max_voting_time: u64,
        cool_off_time: u64,
        hold_up_time: u64,
        extra_weight_lock_time: u64,
        result: Option<ProposalResult>,
        is_executing: bool,
    }

    public struct ProposalExecutor {
        proposal_id: ID,
        current_command_id: ID,
    }

    public struct ProposalCreated has copy, drop {
        proposal_id: ID,
        governance_id: ID,
        name: String,
        link: Url,
        created_at: u64,
    }

    public(package) fun new<T>(
        governance: &mut Governance<T>,
        name: String,
        link: Url,
        clock: &Clock,
        ctx: &mut TxContext,
    ): (Proposal<T>, ProposalOwnerCap) {
        let owner_cap_uid = object::new(ctx);
        let governance_id = object::id(governance);
        let created_at = clock.timestamp_ms();

        let self = Proposal<T> {
            id: object::new(ctx),
            governance_id,
            owner_cap_id: owner_cap_uid.to_inner(),
            name,
            link,
            details: bag::new(ctx),
            options: vector::empty(),
            total_options_vote_weight: 0,
            deny_vote_weight: 0,
            abstain_vote_weight: 0,
            vote_threshold: governance.vote_threshold(),
            created_at,
            voting_at: option::none(),
            max_voting_time: governance.max_voting_time(),
            cool_off_time: governance.cool_off_time(),
            hold_up_time: governance.hold_up_time(),
            extra_weight_lock_time: governance.extra_weight_lock_time(),
            result: option::none(),
            is_executing: false,
        };

        let proposal_id = object::id(&self);

        let owner_cap = ProposalOwnerCap {
            id: owner_cap_uid,
            proposal_id,
            locked_weight: governance.min_weight_to_create_proposal(),
        };

        governance.register_proposal(proposal_id);

        event::emit(
            ProposalCreated {
                proposal_id,
                governance_id,
                name,
                link,
                created_at,
            }
        );

        (self, owner_cap)
    }

    #[allow(lint(share_owned))]
    public(package) fun commit<T>(self: Proposal<T>) {
        transfer::share_object(self);
    }

    public fun start<T>(
        self: &mut Proposal<T>,
        clock: &Clock,
        delay: u64,
        owner_cap: &ProposalOwnerCap,
    ) {
        assert!(
            self.owner_cap_id == object::id(owner_cap),
            EInvalidOwnerCap,
        );
        assert!(self.voting_at.is_none(), EAlreadyStarted);
        self.voting_at.fill(clock.timestamp_ms() + delay);
    }

    public(package) fun cast_vote<T>(
        self: &mut Proposal<T>,
        option_index: Option<u64>,
        is_abstain: bool,
        weight: u64,
        clock: &Clock,
    ) {
        assert!(self.voting_at.is_some(), EVotingIsNotStarted);
        assert!(self.result.is_none(), EAlreadyFinalized);
        let voting_at = *self.voting_at.borrow();
        let time = clock.timestamp_ms();
        assert!(
            (time < voting_at + self.max_voting_time) ||
            ((option_index.is_none() || is_abstain)
                && (time < voting_at + self.max_voting_time + self.cool_off_time)),
            ETooLateToVote,
        );
        if (option_index.is_some()) {
            assert!(
                !is_abstain,
                EInvalidVoteFormat,
            );
            let option_index = option_index.destroy_some();
            let v = &mut self.options[option_index];
            v.vote_weight = v.vote_weight + weight;
            self.total_options_vote_weight = self.total_options_vote_weight + weight;
        } else {
            if (is_abstain) {
                self.abstain_vote_weight = self.abstain_vote_weight + weight;
            } else {
                self.deny_vote_weight = self.deny_vote_weight + weight;
            };
        };
    }

    public(package) fun reliquish_vote<T>(
        self: &mut Proposal<T>,
        option_index: Option<u64>,
        is_abstain: bool,
        weight: u64,
        clock: &Clock,
    ) {
        assert!(self.voting_at.is_some(), EVotingIsNotStarted);
        assert!(self.result.is_none(), EAlreadyFinalized);
        let voting_at = *self.voting_at.borrow();
        let time = clock.timestamp_ms();
        assert!(
            time < voting_at + self.max_voting_time + self.cool_off_time,
            ETooLateToVote,
        );
        if (option_index.is_some()) {
            assert!(
                !is_abstain,
                EInvalidVoteFormat,
            );
            let option_index = option_index.destroy_some();
            let v = &mut self.options[option_index];
            v.vote_weight = v.vote_weight - weight;
            self.total_options_vote_weight = self.total_options_vote_weight - weight;
        } else {
            if (is_abstain) {
                self.abstain_vote_weight = self.abstain_vote_weight - weight;
            } else {
                self.deny_vote_weight = self.deny_vote_weight - weight;
            };
        };
    }

    public fun finalize<T>(
        self: &mut Proposal<T>,
        clock: &Clock,
    ) {
        assert!(self.voting_at.is_some(), EVotingIsNotStarted);
        let voting_at = *self.voting_at.borrow();
        let time = clock.timestamp_ms();
        assert!(
            time >= voting_at + self.max_voting_time + self.cool_off_time,
            ETooEarlyToFinalize,
        );
        assert!(
            self.result.is_none(),
            EAlreadyFinalized
        );
        if (
            (self.total_options_vote_weight + self.abstain_vote_weight + self.deny_vote_weight < self.vote_threshold)
            || (self.deny_vote_weight > self.total_options_vote_weight))
        {
            // Failed proposal
            self.result.fill(ProposalResult {
                finalized_at: time,
                option_index: option::none(),
                executed_at: option::none(),
            });
            return
        };
        let mut i = 0;
        let mut best = 0;
        let mut best_weight = 0;
        let option_count = self.options.length();
        while (i < option_count) {
            let weight = self.options[i].vote_weight;
            if (weight > best_weight) {
                best = i;
                best_weight = weight;
            };
            i = i + 1;
        };

        self.result.fill(ProposalResult {
            finalized_at: time,
            option_index: option::some(best),
            executed_at: option::none(),
        });
    }

    public fun execute_next_command<T>(
        self: &mut Proposal<T>,
        governance: &Governance<T>,
        dominion: &Dominion,
        clock: &Clock,
    ): (Executor, ProposalExecutor) {
        assert!(object::id(governance) == self.governance_id, EWrongGovernance);
        assert!(!self.is_executing, EAlreadyExecuting);
        assert!(self.options.length() > 0, ENotExecutable);
        assert!(self.result.is_some(), ENotFinalized);
        let result = self.result.borrow_mut();
        assert!(
            clock.timestamp_ms() >= result.finalized_at + self.hold_up_time,
            ETooEarlyToExecute,
        );
        assert!(result.option_index.is_some(), EProposalFailed);
        assert!(result.executed_at.is_none(), EAlreadyExecuted);
        let option_index = *result.option_index.borrow();
        let option = &mut self.options[option_index];
        assert!(option.commands.length() > 0, ENotExecutable);
        let current_command = option.commands.remove(option.executed_command_count);
        let current_command_id = object::id(&current_command);
        self.is_executing = true;
        let executor = governance.approve(
            dominion,
            current_command
        );

        let proposal_executor = ProposalExecutor {
            proposal_id: object::id(self),
            current_command_id,
        };

        (executor, proposal_executor)
    }

    public fun commit_command_execution<T>(
        self: &mut Proposal<T>,
        command: Command,
        proposal_executor: ProposalExecutor,
        clock: &Clock,
    ) {
        let ProposalExecutor {
            proposal_id,
            current_command_id
        } = proposal_executor;
        assert!(
            proposal_id == object::id(self),
            EWrongProposalExecutor,
        );
        
        assert!(
            object::id(&command) == current_command_id,
            EWrongCommand,
        );
        let result = self.result.borrow_mut();
        let option_index = *result.option_index.borrow();
        let option = &mut self.options[option_index];
        let success = command.is_executed();
        option.commands.insert(command, option.executed_command_count);
        self.is_executing = false;
        if (!success) {
            return
        };
        option.executed_command_count = option.executed_command_count + 1;
        if (option.executed_command_count == option.commands.length()) {
            result.executed_at.fill(clock.timestamp_ms());
        }
    }

    public fun governance_id<T>(self: &Proposal<T>): ID {
        self.governance_id
    }

    public fun owner_cap_id<T>(self: &Proposal<T>): ID {
        self.owner_cap_id
    }

    public fun name<T>(self: &Proposal<T>): String {
        self.name
    }

    public fun set_name<T>(
        self: &mut Proposal<T>,
        name: String,
        clock: &Clock,
        owner_cap: &ProposalOwnerCap,
    ) {
        assert!(
            self.owner_cap_id == object::id(owner_cap),
            EInvalidOwnerCap,
        );
        assert!(
            self.voting_at.is_none() || *self.voting_at.borrow() > clock.timestamp_ms(),
            EAlreadyStarted,
        );
        self.name = name;
    }

    public fun link<T>(self: &Proposal<T>): Url {
        self.link
    }

    public fun set_link<T>(
        self: &mut Proposal<T>,
        link: Url,
        clock: &Clock,
        owner_cap: &ProposalOwnerCap,
    ) {
        assert!(
            self.owner_cap_id == object::id(owner_cap),
            EInvalidOwnerCap,
        );
        assert!(
            self.voting_at.is_none() || *self.voting_at.borrow() > clock.timestamp_ms(),
            EAlreadyStarted,
        );
        self.link = link;
    }

    // public fun options<T>(self: &Proposal<T>): vector<ProposalOption>,
    public fun total_options_vote_weight<T>(self: &Proposal<T>): u64 {
        self.total_options_vote_weight
    }

    public fun deny_vote_weight<T>(self: &Proposal<T>): u64 {
        self.deny_vote_weight
    }

    public fun abstain_vote_weight<T>(self: &Proposal<T>): u64 {
        self.abstain_vote_weight
    }

    public fun vote_threshold<T>(self: &Proposal<T>): u64 {
        self.vote_threshold
    }

    public fun created_at<T>(self: &Proposal<T>): u64 {
        self.created_at
    }

    public fun voting_at<T>(self: &Proposal<T>): Option<u64> {
        self.voting_at
    }

    public fun max_voting_time<T>(self: &Proposal<T>): u64 {
        self.max_voting_time
    }

    public fun cool_off_time<T>(self: &Proposal<T>): u64 {
        self.cool_off_time
    }

    public fun hold_up_time<T>(self: &Proposal<T>): u64 {
        self.hold_up_time
    }

    public fun extra_weight_lock_time<T>(self: &Proposal<T>): u64 {
        self.extra_weight_lock_time
    }

    public fun add_option<T>(
        self: &mut Proposal<T>,
        label: String,
        commands: vector<Command>,
        clock: &Clock,
        owner_cap: &ProposalOwnerCap,
        ctx: &mut TxContext,
    ) {
        assert!(
            self.owner_cap_id == object::id(owner_cap),
            EInvalidOwnerCap,
        );
        assert!(
            self.voting_at.is_none() || *self.voting_at.borrow() > clock.timestamp_ms(),
            EAlreadyStarted,
        );
        self.options.push_back(
            ProposalOption {
                label,
                commands,
                details: bag::new(ctx),
                vote_weight: 0,
                executed_command_count: 0,
            }
        );
    }

    public fun insert_option<T>(
        self: &mut Proposal<T>,
        label: String,
        commands: vector<Command>,
        index: u64,
        clock: &Clock,
        owner_cap: &ProposalOwnerCap,
        ctx: &mut TxContext,
    ) {
        assert!(
            self.owner_cap_id == object::id(owner_cap),
            EInvalidOwnerCap,
        );
        assert!(
            self.voting_at.is_none() || *self.voting_at.borrow() > clock.timestamp_ms(),
            EAlreadyStarted,
        );
        self.options.insert(
            ProposalOption {
                label,
                commands,
                details: bag::new(ctx),
                vote_weight: 0,
                executed_command_count: 0,
            },
            index
        );
    }

    public fun remove_option<T>(
        self: &mut Proposal<T>,
        index: u64,
        clock: &Clock,
        owner_cap: &ProposalOwnerCap,
    ): vector<Command> {
        assert!(
            self.owner_cap_id == object::id(owner_cap),
            EInvalidOwnerCap,
        );
        assert!(
            self.voting_at.is_none() || *self.voting_at.borrow() > clock.timestamp_ms(),
            EAlreadyStarted,
        );
        let ProposalOption {
            label: _,
            commands,
            details,
            vote_weight: _,
            executed_command_count: _,
        } = self.options.remove(index);
        details.destroy_empty();
        commands
    }

    public fun replace_option_commands<T>(
        self: &mut Proposal<T>,
        index: u64,
        commands: vector<Command>,
        clock: &Clock,
        owner_cap: &ProposalOwnerCap,
    ): vector<Command> {
        assert!(
            self.owner_cap_id == object::id(owner_cap),
            EInvalidOwnerCap,
        );
        assert!(
            self.voting_at.is_none() || *self.voting_at.borrow() > clock.timestamp_ms(),
            EAlreadyStarted,
        );
        let ProposalOption {
            label,
            commands: old_commands,
            details,
            vote_weight,
            executed_command_count,
        } = self.options.remove(index);
        self.options.insert(ProposalOption {
            label,
            commands,
            details,
            vote_weight,
            executed_command_count
        }, index);
        old_commands
    }

    public fun proposal_id(self: &ProposalOwnerCap): ID {
        self.proposal_id
    }

    public fun locked_weight(self: &ProposalOwnerCap): u64 {
        self.locked_weight
    }

    // public fun voting_result
}