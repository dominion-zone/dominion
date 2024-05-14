module dominion_governance::governance {
    use dominion::dominion::{Dominion, DominionOwnerCap};
    use std::string::String;
    use sui::url::Url;
    use sui::bag::{Self, Bag};

    const EInvalidAdminCap: u64 = 0;
    const EInvalidVetoCap: u64 = 1;
    // const EProposalNotFound: u64 = 1;

    public struct GovernanceAdminCap has key, store {
        id: UID,
        governance_id: ID,
    }

    public struct VetoCap has key, store {
        id: UID,
        governance_id: ID,
    }

    public struct Governance<phantom T> has key {
        id: UID,
        admin_cap_id: ID,
        admin_address: address,
        veto_cap_id: ID,
        veto_address: address,
        dominion_owner_cap: DominionOwnerCap,
        name: String,
        link: Url,
        details: Bag,
        min_weight_to_create_proposal: u64,
        vote_threshold: u64,
        max_voting_time: u64,
        cool_off_time: u64,
        hold_up_time: u64,
        extra_weight_lock_time: u64,
    }

    public fun new<T>(
        dominion: &mut Dominion,
        dominion_owner_cap: DominionOwnerCap,
        name: String,
        link: Url,
        min_weight_to_create_proposal: u64,
        vote_threshold: u64,
        max_voting_time: u64,
        ctx: &mut TxContext
    ): (Governance<T>, GovernanceAdminCap, VetoCap) {
        let admin_cap_uid = object::new(ctx);
        let veto_cap_uid = object::new(ctx);
        let self_uid = object::new(ctx);
        let governance_id = self_uid.to_inner();

        dominion.set_owner_address(
            &dominion_owner_cap,
            governance_id.to_address()
        );

        let self = Governance<T> {
            id: self_uid,
            admin_cap_id: admin_cap_uid.to_inner(),
            admin_address: admin_cap_uid.to_address(),
            veto_cap_id: veto_cap_uid.to_inner(),
            veto_address: veto_cap_uid.to_address(),
            dominion_owner_cap,
            name,
            link,
            details: bag::new(ctx),
            min_weight_to_create_proposal,
            vote_threshold,
            max_voting_time,
            cool_off_time: 0,
            hold_up_time: 0,
            extra_weight_lock_time: 0,
        };

        let admin_cap = GovernanceAdminCap {
            id: admin_cap_uid,
            governance_id
        };

        let veto_cap = VetoCap {
            id: veto_cap_uid,
            governance_id,
        };

        (self, admin_cap, veto_cap)
    }

    #[allow(lint(share_owned))]
    public fun commit<T>(self: Governance<T>) {
        transfer::share_object(self);
    }

    /*
    public(package) fun register_proposal<T>(
        self: &mut Governance<T>,
        proposal_id: ID
    ) {
        self.active_proposal_ids.push_back(proposal_id);
    }

    public(package) fun on_proposal_executed<T>(
        self: &mut Governance<T>,
        proposal_id: ID
    ) {
        let (found, i) = self.active_proposal_ids.index_of(&proposal_id);
        assert!(found, EProposalNotFound);
        self.active_proposal_ids.swap_remove(i);
    }
    */

    public fun admin_cap_id<T>(self: &Governance<T>): ID {
        self.admin_cap_id
    }

    public fun admin_address<T>(self: &Governance<T>): address {
        self.admin_address
    }

    public fun set_admin_address<T>(
        self: &mut Governance<T>,
        admin_cap: &GovernanceAdminCap,
        admin_address: address
    ) {
        assert!(
            object::id(admin_cap) == self.admin_cap_id,
            EInvalidAdminCap
        );
        self.admin_address = admin_address;
    }

    public fun veto_cap_id<T>(self: &Governance<T>): ID {
        self.veto_cap_id
    }

    public fun veto_address<T>(self: &Governance<T>): address {
        self.veto_address
    }

    public fun set_veto_address<T>(
        self: &mut Governance<T>,
        veto_cap: &VetoCap,
        veto_address: address
    ) {
        assert!(
            object::id(veto_cap) == self.veto_cap_id,
            EInvalidVetoCap
        );
        self.veto_address = veto_address;
    }
    
    public fun name<T>(self: &Governance<T>): String {
        self.name
    }

    public fun set_name<T>(
        self: &mut Governance<T>,
        admin_cap: &GovernanceAdminCap,
        new_name: String
    ) {
        assert!(
            object::id(admin_cap) == self.admin_cap_id,
            EInvalidAdminCap
        );
        self.name = new_name;
    }

    public fun link<T>(self: &Governance<T>): Url {
        self.link
    }

    public fun set_link<T>(
        self: &mut Governance<T>,
        admin_cap: &GovernanceAdminCap,
        new_link: Url
    ) {
        assert!(
            object::id(admin_cap) == self.admin_cap_id,
            EInvalidAdminCap
        );
        self.link = new_link;
    }

    public fun min_weight_to_create_proposal<T>(self: &Governance<T>): u64 {
        self.min_weight_to_create_proposal
    }

    public fun set_min_weight_to_create_proposal<T>(
        self: &mut Governance<T>,
        admin_cap: &GovernanceAdminCap,
        new_value: u64
    ) {
        assert!(object::id(admin_cap) == self.admin_cap_id, EInvalidAdminCap);
        self.min_weight_to_create_proposal = new_value;
    }
    
    public fun vote_threshold<T>(self: &Governance<T>): u64 {
        self.vote_threshold
    }

    public fun set_vote_threshold<T>(
        self: &mut Governance<T>,
        admin_cap: &GovernanceAdminCap,
        new_value: u64
    ) {
        assert!(object::id(admin_cap) == self.admin_cap_id, EInvalidAdminCap);
        self.vote_threshold = new_value;
    }
    
    public fun max_voting_time<T>(self: &Governance<T>): u64 {
        self.max_voting_time
    }

    public fun set_max_voting_time<T>(
        self: &mut Governance<T>,
        admin_cap: &GovernanceAdminCap,
        new_value: u64
    ) {
        assert!(object::id(admin_cap) == self.admin_cap_id, EInvalidAdminCap);
        self.max_voting_time = new_value;
    }

    public fun cool_off_time<T>(self: &Governance<T>): u64 {
        self.cool_off_time
    }

    public fun set_cool_off_time<T>(
        self: &mut Governance<T>,
        admin_cap: &GovernanceAdminCap,
        new_value: u64
    ) {
        assert!(object::id(admin_cap) == self.admin_cap_id, EInvalidAdminCap);
        self.cool_off_time = new_value;
    }
    
    public fun hold_up_time<T>(self: &Governance<T>): u64 {
        self.hold_up_time
    }

    public fun set_hold_up_time<T>(
        self: &mut Governance<T>,
        admin_cap: &GovernanceAdminCap,
        new_value: u64
    ) {
        assert!(object::id(admin_cap) == self.admin_cap_id, EInvalidAdminCap);
        self.hold_up_time = new_value;
    }

    public fun extra_weight_lock_time<T>(self: &Governance<T>): u64 {
        self.extra_weight_lock_time
    }

    public fun set_extra_weight_lock_time<T>(
        self: &mut Governance<T>,
        admin_cap: &GovernanceAdminCap,
        new_value: u64
    ) {
        assert!(object::id(admin_cap) == self.admin_cap_id, EInvalidAdminCap);
        self.extra_weight_lock_time = new_value;
    }

    public fun admin_cap_governance_id(
        self: &GovernanceAdminCap
    ): ID {
        self.governance_id
    }
    public use fun admin_cap_governance_id as GovernanceAdminCap.governance_id;
}

