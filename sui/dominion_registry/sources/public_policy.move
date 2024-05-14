module dominion_registry::public_policy {
    use std::string::String;
    use dominion_registry::dominion_registry::{Self, DominionRegistry, OwnerCap};
    use dominion::dominion::{Dominion, DominionAdminCap};
    
    const EInvalidAdminCap: u64 = 0;
    const EInvalidDominionAdminCap: u64 = 1;

    public struct AdminCap has key, store {
        id: UID,
        policy_id: ID,
    }

    public struct PublicPolicy has key {
        id: UID,
        admin_cap_id: ID,
        owner_cap: OwnerCap,
    }

    public fun new(
        registry: &mut DominionRegistry,
        owner_cap: OwnerCap,
        ctx: &mut TxContext,
    ): (PublicPolicy, AdminCap) {
        let admin_cap_uid = object::new(ctx);
        let self_uid = object::new(ctx);
        let policy_id = self_uid.to_inner();
        registry.set_policy_address(&owner_cap, policy_id.to_address());

        let self = PublicPolicy {
            id: self_uid,
            admin_cap_id: admin_cap_uid.to_inner(),
            owner_cap,
        };

        let admin_cap = AdminCap {
            id: admin_cap_uid,
            policy_id,
        };

        (self, admin_cap)
    }

    #[allow(lint(share_owned))]
    public fun commit(self: PublicPolicy) {
        transfer::share_object(self);
    }

    entry fun create(
        mut registry: DominionRegistry,
        owner_cap: OwnerCap,
        ctx: &mut TxContext,
    ) {
        let (self, admin_cap) = new(&mut registry, owner_cap, ctx);

        transfer::transfer(admin_cap, ctx.sender());
        registry.commit();
        self.commit();
    }

    public fun new_with_registry(
        ctx: &mut TxContext,
    ): AdminCap {
        let (mut registry, owner_cap) = dominion_registry::new(ctx);
        let (self, admin_cap) = new(&mut registry, owner_cap, ctx);
        registry.commit();
        self.commit();
        admin_cap
    }

    entry fun create_with_registry(
        ctx: &mut TxContext,
    ) {
        let admin_cap = new_with_registry(ctx);

        transfer::transfer(admin_cap, ctx.sender());
    }

    public fun delete(
        self: PublicPolicy,
        admin_cap: &AdminCap,
    ): OwnerCap {
        let PublicPolicy {
            id,
            admin_cap_id,
            owner_cap
        } = self;

        assert!(
            object::id(admin_cap) == admin_cap_id,
            EInvalidAdminCap,
        );

        id.delete();

        owner_cap
    }

    entry fun destroy(
        self: PublicPolicy,
        registry: &mut DominionRegistry,
        admin_cap: &AdminCap,
        ctx: &TxContext,
    ) {
        let owner_cap = self.delete(admin_cap);
        registry.set_policy_address(&owner_cap, object::id_address(&owner_cap));
        transfer::public_transfer(owner_cap, ctx.sender());
    }

    public entry fun push_back_entry(
        self: &PublicPolicy,
        registry: &mut DominionRegistry,
        dominion: &Dominion,
        url_name: String,
        admin_cap: &DominionAdminCap,
    ) {
        assert!(
            object::id(admin_cap) == dominion.admin_cap_id(),
            EInvalidDominionAdminCap,
        );
        let index = registry.entry_count();
        registry.insert_entry(
            index,
            dominion,
            url_name,
            &self.owner_cap,
        )
    }

    public entry fun update_entry(
        self: &PublicPolicy,
        registry: &mut DominionRegistry,
        dominion: &Dominion,
        url_name: String,
        admin_cap: &DominionAdminCap,
    ) {
        assert!(
            object::id(admin_cap) == dominion.admin_cap_id(),
            EInvalidDominionAdminCap,
        );
        registry.update_entry(
            dominion,
            url_name,
            &self.owner_cap,
        )
    }

    public entry fun remove_entry(
        self: &PublicPolicy,
        registry: &mut DominionRegistry,
        dominion: &Dominion,
        admin_cap: &DominionAdminCap,
    ) {
        assert!(
            object::id(admin_cap) == dominion.admin_cap_id(),
            EInvalidDominionAdminCap,
        );
        registry.remove_entry(
            dominion,
            &self.owner_cap,
        )
    }

    public entry fun forced_insert_entry(
        self: &PublicPolicy,
        registry: &mut DominionRegistry,
        index: u64,
        dominion: &Dominion,
        url_name: String,
        admin_cap: &AdminCap,
    ) {
        assert!(
            object::id(admin_cap) == self.admin_cap_id(),
            EInvalidAdminCap,
        );
        registry.insert_entry(
            index,
            dominion,
            url_name,
            &self.owner_cap,
        )
    }

    public entry fun forced_update_entry(
        self: &PublicPolicy,
        registry: &mut DominionRegistry,
        dominion: &Dominion,
        url_name: String,
        admin_cap: &AdminCap,
    ) {
        assert!(
            object::id(admin_cap) == self.admin_cap_id(),
            EInvalidAdminCap,
        );
        registry.update_entry(
            dominion,
            url_name,
            &self.owner_cap,
        )
    }

    public entry fun forced_remove_entry(
        self: &PublicPolicy,
        registry: &mut DominionRegistry,
        dominion: &Dominion,
        admin_cap: &AdminCap,
    ) {
        assert!(
            object::id(admin_cap) == self.admin_cap_id(),
            EInvalidAdminCap,
        );
        registry.remove_entry(
            dominion,
            &self.owner_cap,
        )
    }

    public fun admin_cap_id(self: &PublicPolicy): ID {
        self.admin_cap_id
    }

    public fun policy_id(self: &AdminCap): ID {
        self.policy_id
    }
}