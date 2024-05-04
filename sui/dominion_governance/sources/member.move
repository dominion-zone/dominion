module dominion_governance::member {
    use std::string::String;
    use sui::url::Url;
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::clock::Clock;
    use sui::math;
    use dominion_governance::governance::{Self, Governance};
    use dominion_governance::proposal::{Self, Proposal, ProposalOwnerCap};

    const EInvalidGovernance: u64 = 0;
    const ENotEnoughVotingWeight: u64 = 1;
    const EProposalOwnerCapNotFound: u64 = 2;
    const ENotEnoughFunds: u64 = 3;

    public struct Vote has store {
        proposal_id: ID,
        option_index: Option<u64>,
        is_abstain: bool,
        weight: u64,
    }

    public struct Member<phantom T> has key, store {
        id: UID,
        governance_id: ID,
        balance: Balance<T>,
        votes: vector<Vote>,
        proposal_owner_caps: vector<ProposalOwnerCap>,
    }

    public fun new<T>(
        governance: &Governance<T>,
        ctx: &mut TxContext
    ): Member<T> {
        Member {
            id: object::new(ctx),
            governance_id: object::id(governance),
            balance: balance::zero(),
            votes: vector::empty(),
            proposal_owner_caps: vector::empty(),
        }
    }

    entry fun create<T>(
        governance: &Governance<T>,
        ctx: &mut TxContext
    ) {
        let self = new(
            governance,
            ctx,
        );
        transfer::transfer(self, ctx.sender());
    }

    public fun deposit_balance<T>(
        self: &mut Member<T>,
        balance: Balance<T>,
    ) {
        self.balance.join(balance);
    }

    public entry fun deposit<T>(
        self: &mut Member<T>,
        coin: Coin<T>,
    ) {
        coin::put(&mut self.balance, coin);
    }

    public fun withdraw_balance<T>(
        self: &mut Member<T>,
        amount: u64,
    ): Balance<T> {
        assert!(
            self.voting_weight() >= self.locked_weight() + amount,
            ENotEnoughFunds,
        );

        self.balance.split(amount)
    }

    entry fun withdraw<T>(
        self: &mut Member<T>,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(
            self.voting_weight() >= self.locked_weight() + amount,
            ENotEnoughFunds,
        );

        let coin = coin::take(&mut self.balance, amount, ctx);
        transfer::public_transfer(coin, ctx.sender());
    }

    public fun new_proposal<T>(
        self: &mut Member<T>,
        governance: &mut Governance<T>,
        name: String,
        link: Url,
        clock: &Clock,
        ctx: &mut TxContext,
    ): Proposal<T> {
        assert!(object::id(governance) == self.governance_id, EInvalidGovernance);
        assert!(
            self.voting_weight() >= governance.min_weight_to_create_proposal(),
            ENotEnoughVotingWeight
        );
        let (proposal, owner_cap) = proposal::new<T>(
            governance,
            name,
            link,
            clock,
            ctx
        );

        // governance.register_proposal(object::id(&proposal));
        self.proposal_owner_caps.push_back(owner_cap);

        proposal
    }

    public fun proposal_owner_cap<T>(
        self: &Member<T>,
        proposal_id: ID
    ): &ProposalOwnerCap {
        let mut i = 0;
        let n = self.proposal_owner_caps.length();
        while (i < n) {
            let owner_cap = &self.proposal_owner_caps[i];
            if (owner_cap.proposal_id() == proposal_id) {
                return owner_cap
            };
            i = i + 1;
        };
        abort EProposalOwnerCapNotFound
    }

    public fun proposal_owner_cap_by_index<T>(
        self: &Member<T>,
        index: u64
    ): &ProposalOwnerCap {
        &self.proposal_owner_caps[index]
    }

    public fun cast_vote<T>(
        self: &mut Member<T>,
        proposal: &mut Proposal<T>,
        option_index: Option<u64>,
        is_abstain: bool,
        reliquish: bool,
    ) {
        assert!(
            proposal.governance_id() == self.governance_id,
            EInvalidGovernance
        );

        let weight = if (reliquish) { 0 } else { self.voting_weight() };

        let proposal_id = object::id(proposal);
        let mut i = 0;
        let n = self.votes.length();
        while (i < n) {
            if (&self.votes[i].proposal_id == proposal_id) {
                break
            };
            i = i + 1;
        };
        if (i < n) {
            let Vote {
                proposal_id: _,
                option_index,
                is_abstain,
                weight,
            } = self.votes.remove(i);

            proposal.reliquish_vote(
                option_index,
                is_abstain,
                weight
            );
        };
        
        if (weight > 0) {
            self.votes.push_back(
                Vote {
                    proposal_id,
                    option_index,
                    is_abstain,
                    weight
                }
            );

            proposal.cast_vote(
                option_index,
                is_abstain,
                weight,
            );
        };
    }

    public fun voting_weight<T>(self: &Member<T>): u64 {
        self.balance.value()
    }

    public fun locked_weight<T>(self: &Member<T>): u64 {
        let mut locked_weight = 0u64;
        let voteCount = self.votes.length();
        if (voteCount > 0) {
            locked_weight = self.votes[voteCount - 1].weight;
        };

        let proposal_count = self.proposal_owner_caps.length();
        if (proposal_count > 0) {
            locked_weight = math::max(
                locked_weight,
                self.proposal_owner_caps[proposal_count - 1].locked_weight()
            );
        };

        locked_weight
    }
}