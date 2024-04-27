module dominion_governance::vote {
    use std::string::String;
    use sui::url::Url;
    use sui::vec_map::{Self, VecMap};
    use sui::balance::{Self, Balance};
    use sui::clock::Clock;
    use dominion_governance::governance::{Self, Governance};
    use dominion_governance::proposal::{Self, Proposal, ProposalOwnerCap};

    const EInvalidGovernance: u64 = 0;
    const ENotEnoughVotingWeight: u64 = 1;
    const EProposalOwnerCapNotFound: u64 = 2;

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
        locked_weight: u64,
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
            locked_weight: 0,
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
        if (self.locked_weight < governance.min_weight_to_create_proposal()) {
            self.locked_weight = governance.min_weight_to_create_proposal();
        };

        governance.register_proposal(object::id(&proposal));
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
                return owner_cap;
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
        weight: Option<u64>,
    ) {
        assert!(
            proposal.governance_id() == self.governance_id,
            EInvalidGovernance
        );

        let weight = if (weight.is_some()) {
            let weight = weight.destroy_some();
            assert!(weight <= self.voting_weight(), ENotEnoughVotingWeight);
            weight
        } else {
            self.voting_weight()
        };

        if (self.locked_weight < weight) {
            self.locked_weight = weight;
        };

        let proposal_id = object::id(proposal);
        let mut i = 0;
        let n = self.votes.length();
        while (i < n) {
            if (&self.votes[i].proposal_id == proposal_id) {
                break;
            };
            i = i + 1;
        };
        if (i < n) {
            let vote = &mut self.votes[i];
            proposal.reliquish_vote(
                vote.option_index,
                vote.is_abstain,
                vote.weight
            );
            vote.option_index = option_index;
            vote.weight = weight;
            vote.is_abstain = is_abstain;

            if (weight == 0) {
                let Vote {
                    proposal_id: _,
                    option_index: _,
                    is_abstain: _,
                    weight: _
                } = self.votes.swap_remove(i);
            }
        } else {
            if (weight > 0) {
                self.votes.push_back(
                    Vote {
                        proposal_id,
                        option_index,
                        is_abstain,
                        weight
                    }
                );
            }
        };

        if (weight > 0) {
            proposal.cast_vote(
                option_index,
                is_abstain,
                weight,
            );
        }
    }

    public fun voting_weight<T>(self: &Member<T>): u64 {
        self.balance.value()
    }

    public fun locked_weight<T>(self: &Member<T>): u64 {
        self.locked_weight
    }
}