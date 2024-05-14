module dominion::dominion {
    use std::type_name::{Self, TypeName};
    use sui::vec_set::{Self, VecSet};
    use dominion::command::{Self, Command};
    use dominion::executor::{Self, Executor};

    const EInvalidCommander: u64 = 1;
    const EInvalidAdminCap: u64 = 2;
    const EInvalidOwnerCap: u64 = 3;
    const EInvalidCommandDominion: u64 = 4;

    public struct Dominion has key {
        id: UID,
        admin_cap_id: ID,
        admin_address: address,
        owner_cap_id: ID,
        owner_address: address,
        commanders: VecSet<TypeName>,
    }

    public struct DominionAdminCap has key, store {
        id: UID,
        dominion_id: ID,
    }

    public struct DominionOwnerCap has key, store {
        id: UID,
        dominion_id: ID,
    }

    public fun new(
        ctx: &mut TxContext,
    ): (Dominion, DominionAdminCap, DominionOwnerCap) {
        let admin_cap_uid = object::new(ctx);
        let owner_cap_uid = object::new(ctx);
        let self = Dominion {
            id: object::new(ctx),
            admin_cap_id: admin_cap_uid.to_inner(),
            admin_address: admin_cap_uid.to_address(),
            owner_cap_id: owner_cap_uid.to_inner(),
            owner_address: owner_cap_uid.to_address(),
            commanders: vec_set::empty(),
        };
        let dominion_id = object::id(&self);

        let admin_cap = DominionAdminCap {
            id: admin_cap_uid,
            dominion_id,
        };
        let owner_cap = DominionOwnerCap {
            id: owner_cap_uid,
            dominion_id,
        };
        (self, admin_cap, owner_cap)
    }

    #[allow(lint(share_owned))]
    public fun commit(self: Dominion) {
        transfer::share_object(self);
    }

    /*
    entry fun create(
        ctx: &mut TxContext,
    ) {
        let (self, admin_cap, owner_cap) = new(ctx);
        share(self);
        transfer::transfer(
            admin_cap,
            ctx.sender(),
        );
        transfer::transfer(
            owner_cap,
            ctx.sender(),
        );
    }*/

    public fun enable_commander_by_name(
        self: &mut Dominion,
        commander: TypeName,
        admin_cap: &DominionAdminCap,
    ) {
        assert!(
            self.admin_cap_id == object::id(admin_cap),
            EInvalidAdminCap
        );
        vec_set::insert(&mut self.commanders, commander);
    }

    public fun enable_commander<C: drop>(
        self: &mut Dominion,
        admin_cap: &DominionAdminCap,
    ) {
        self.enable_commander_by_name(type_name::get<C>(), admin_cap);
    }

    public fun disable_commander_by_name(
        self: &mut Dominion,
        commander: TypeName,
        admin_cap: &DominionAdminCap,
    ) {
        assert!(
            self.admin_cap_id == object::id(admin_cap),
            EInvalidAdminCap
        );
        vec_set::remove(&mut self.commanders, &commander);
    }

    public fun disable_commander<C: drop>(
        self: &mut Dominion,
        admin_cap: &DominionAdminCap,
    ) {
        self.disable_commander_by_name(type_name::get<C>(), admin_cap);
    }

    public fun reset_owner_cap(
        self: &mut Dominion,
        admin_cap: &DominionAdminCap,
        ctx: &mut TxContext,
    ): DominionOwnerCap {
        assert!(
            self.admin_cap_id == object::id(admin_cap),
            EInvalidAdminCap
        );
        let owner_cap = DominionOwnerCap {
            id: object::new(ctx),
            dominion_id: object::id(self),
        };
        self.owner_cap_id = object::id(&owner_cap);
        self.owner_address = object::id_address(&owner_cap);
        owner_cap
    }

    public entry fun recreate_owner_cap(
        self: &mut Dominion,
        admin_cap: &DominionAdminCap,
        ctx: &mut TxContext,
    ) {
        let owner_cap = reset_owner_cap(
            self,
            admin_cap,
            ctx
        );
        transfer::transfer(
            owner_cap,
            ctx.sender(),
        );
    }

    public fun approve(
        self: &Dominion,
        command: Command,
        owner_cap: &DominionOwnerCap,
    ): Executor {
        assert!(
            object::id(owner_cap) == self.owner_cap_id,
            EInvalidOwnerCap,
        );
        assert!(
            command.dominion_id() == object::id(self),
            EInvalidCommandDominion,
        );
        assert!(
            self.has_commander(command.commander()),
            EInvalidCommander,
        );
        executor::new(
            command
        )
    }

    public fun mut_id<C: drop>(
        self: &mut Dominion,
        _commander: C
    ): &mut UID {
        assert!(
            self.check_commander<C>(),
            EInvalidCommander,
        );
        &mut self.id
    }

    public fun new_command<C: drop, P: store>(
        self: &Dominion,
        commander: C,
        payload: P,
        ctx: &mut TxContext,
    ): Command {
        assert!(
            self.check_commander<C>(),
            EInvalidCommander,
        );

        command::new<C, P>(
            object::id(self),
            commander,
            payload,
            ctx
        )
    }

    public fun new_command_from_object<C: drop, P: key + store>(
        self: &Dominion,
        commander: C,
        payload: P,
        ctx: &mut TxContext,
    ): Command {
        assert!(
            self.check_commander<C>(),
            EInvalidCommander,
        );

        command::new_from_object<C, P>(
            object::id(self),
            commander,
            payload,
            ctx
        )
    }

    public fun admin_cap_id(
        self: &Dominion
    ): ID {
        self.admin_cap_id
    }

    public fun admin_address(
        self: &Dominion
    ): address {
        self.admin_address
    }

    public fun set_admin_address(
        self: &mut Dominion,
        admin_cap: &DominionAdminCap,
        admin_address: address
    ) {
        assert!(
            self.admin_cap_id == object::id(admin_cap),
            EInvalidAdminCap
        );

        self.admin_address = admin_address;
    }

    public fun owner_cap_id(
        self: &Dominion
    ): ID {
        self.owner_cap_id
    }

    public fun owner_address(
        self: &Dominion
    ): address {
        self.owner_address
    }

    public fun set_owner_address(
        self: &mut Dominion,
        owner_cap: &DominionOwnerCap,
        owner_address: address
    ) {
        assert!(
            object::id(owner_cap) == self.owner_cap_id,
            EInvalidOwnerCap,
        );

        self.owner_address = owner_address;
    }

    public fun check_commander<C: drop>(
        self: &Dominion
    ): bool {
        self.has_commander(type_name::get<C>())
    }

    public fun has_commander(
        self: &Dominion,
        commander: TypeName
    ): bool {
        vec_set::contains(&self.commanders, &commander)
    }

    public fun admin_cap_dominion_id(
        self: &DominionAdminCap
    ): ID {
        self.dominion_id
    }
    public use fun admin_cap_dominion_id as DominionAdminCap.dominion_id;

    public fun owner_cap_dominion_id(
        self: &DominionOwnerCap
    ): ID {
        self.dominion_id
    }
    public use fun owner_cap_dominion_id as DominionOwnerCap.dominion_id;
}
