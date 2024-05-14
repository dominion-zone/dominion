module dominion_governance::proposal {
    use std::string::String;
    use sui::url::Url;
    use sui::bag::{Self, Bag};
    use sui::clock::Clock;

    use dominion::command::Command;

    use dominion_governance::governance::Governance;

    const EInvalidVoteFormat: u64 = 0;

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
    }

    public(package) fun new<T>(
        governance: &Governance<T>,
        name: String,
        link: Url,
        clock: &Clock,
        ctx: &mut TxContext,
    ): (Proposal<T>, ProposalOwnerCap) {
        let owner_cap_uid = object::new(ctx);

        let self = Proposal<T> {
            id: object::new(ctx),
            governance_id: object::id(governance),
            owner_cap_id: owner_cap_uid.to_inner(),
            name,
            link,
            details: bag::new(ctx),
            options: vector::empty(),
            total_options_vote_weight: 0,
            deny_vote_weight: 0,
            abstain_vote_weight: 0,
            vote_threshold: governance.vote_threshold(),
            created_at: clock.timestamp_ms(),
            voting_at: option::none(),
            max_voting_time: governance.max_voting_time(),
            cool_off_time: governance.cool_off_time(),
            hold_up_time: governance.hold_up_time(),
            extra_weight_lock_time: governance.extra_weight_lock_time(),
            result: option::none(),
        };

        let owner_cap = ProposalOwnerCap {
            id: owner_cap_uid,
            proposal_id: object::id(&self),
            locked_weight: governance.min_weight_to_create_proposal(),
        };

        (self, owner_cap)
    }

    #[allow(lint(share_owned))]
    public fun commit<T>(self: Proposal<T>) {
        transfer::share_object(self);
    }

    public(package) fun cast_vote<T>(
        self: &mut Proposal<T>,
        option_index: Option<u64>,
        is_abstain: bool,
        weight: u64
    ) {
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
        weight: u64
    ) {
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

    public fun governance_id<T>(self: &Proposal<T>): ID {
        self.governance_id
    }

    public fun owner_cap_id<T>(self: &Proposal<T>): ID {
        self.owner_cap_id
    }

    public fun name<T>(self: &Proposal<T>): String {
        self.name
    }

    public fun link<T>(self: &Proposal<T>): Url {
        self.link
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

    public fun proposal_id(self: &ProposalOwnerCap): ID {
        self.proposal_id
    }

    public fun locked_weight(self: &ProposalOwnerCap): u64 {
        self.locked_weight
    }

    // public fun voting_result
}