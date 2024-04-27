module dominion::dominion {
    use sui::vec_set::{Self, VecSet};
    use dominion::commander_cap::CommanderCap;
    use dominion::command::{Self, Command};
    use dominion::executor::{Self, Executor};

    const EInvalidCommanderCap: u64 = 1;
    const EInvalidAdminCap: u64 = 2;
    const EInvalidOwnerCap: u64 = 3;
    const EInvalidCommandDominion: u64 = 4;
    const EInvalidCommandCommanderCap: u64 = 5;

    public struct Dominion has key {
        id: UID,
        admin_cap_id: ID,
        owner_cap_id: ID,
        commander_cap_ids: VecSet<ID>,
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
            owner_cap_id: owner_cap_uid.to_inner(),
            commander_cap_ids: vec_set::empty(),
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

    public fun enable_commander(
        self: &mut Dominion,
        commander_cap_id: ID,
        admin_cap: &DominionAdminCap,
    ) {
        assert!(
            self.admin_cap_id == object::id(admin_cap),
            EInvalidAdminCap
        );
        vec_set::insert(&mut self.commander_cap_ids, commander_cap_id);
    }

    public fun disable_commander(
        self: &mut Dominion,
        commander_cap_id: ID,
        admin_cap: &DominionAdminCap,
    ) {
        assert!(
            self.admin_cap_id == object::id(admin_cap),
            EInvalidAdminCap
        );
        vec_set::remove(&mut self.commander_cap_ids, &commander_cap_id);
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
            EInvalidOwnerCap
        );
        assert!(
            command.dominion_id() == object::id(self),
            EInvalidCommandDominion,
        );
        assert!(
            self.has_commander_cap_id(command.commander_cap_id()),
            EInvalidCommandCommanderCap,
        );
        executor::new(
            command
        )
    }

    public fun mut_id<T>(
        self: &mut Dominion,
        executor: &Executor,
        commander_cap: &CommanderCap<T>
    ): &mut UID {
        assert!(
            self.has_commander_cap_id(object::id(commander_cap)),
            EInvalidCommanderCap,
        );
        assert!(
            executor.dominion_id() == object::id(self),
            EInvalidCommandDominion
        );
        assert!(
            executor.commander_cap_id() == object::id(commander_cap),
            EInvalidCommandCommanderCap
        );
        &mut self.id
    }

    public fun new_command<T, P: store>(
        self: &Dominion,
        payload: P,
        commander_cap: &CommanderCap<T>,
        ctx: &mut TxContext,
    ): Command {
        assert!(
            self.has_commander_cap_id(object::id(commander_cap)),
            EInvalidCommanderCap,
        );

        command::new(
            object::id(self),
            payload,
            commander_cap,
            ctx
        )
    }

    public fun new_command_from_object<T, P: key + store>(
        self: &Dominion,
        payload: P,
        commander_cap: &CommanderCap<T>,
        ctx: &mut TxContext,
    ): Command {
        assert!(
            self.has_commander_cap_id(object::id(commander_cap)),
            EInvalidCommanderCap,
        );

        command::new_from_object(
            object::id(self),
            payload,
            commander_cap,
            ctx
        )
    }

    public fun admin_cap_id(
        self: &Dominion
    ): ID {
        self.admin_cap_id
    }

    public fun owner_cap_id(
        self: &Dominion
    ): ID {
        self.owner_cap_id
    }

    public fun has_commander_cap_id(
        self: &Dominion,
        commander_cap_id: ID
    ): bool {
        vec_set::contains(&self.commander_cap_ids, &commander_cap_id)
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
