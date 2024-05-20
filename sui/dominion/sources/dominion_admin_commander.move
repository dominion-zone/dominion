module dominion::dominion_admin_commander {
    use std::type_name::{Self, TypeName};
    use dominion::command::Command;
    use dominion::executor::Executor;
    use dominion::dominion::{Self, Dominion, DominionAdminCap};
    use sui::dynamic_field;
    use std::string;
    use sui::transfer::Receiving;

    const KTransferAdminCap: u8 = 0;
    const KEnableCommander: u8 = 1;
    const KDisableCommander: u8 = 2;
    const KResetOwnerCap: u8 = 3;


    const TAdminCapRecepient: u8 = 32;
    const TCommander: u8 = 33;
    const TOwnerCapRecepient: u8 = 34;

    const EInvalidCommandKind: u64 = 0;
    const EInvalidTargetDominion: u64 = 2;
    const EDisablingSelf: u64 = 3;

    public struct DominionAdminCommander has drop()

    public struct AdminCommand has key, store {
        id: UID,
        kind: u8,
        target_dominion_id: ID,
    }

    public entry fun enable(
        dominion: &mut Dominion,
        admin_cap: &DominionAdminCap,
    ) {
        dominion.enable_commander<DominionAdminCommander>(
            admin_cap,
        );
    }

    public entry fun disable(
        dominion: &mut Dominion,
        admin_cap: &DominionAdminCap,
    ) {
        dominion.disable_commander<DominionAdminCommander>(
            admin_cap,
        );
    }

    public fun new_transfer_admin_cap_command(
        dominion: &Dominion,
        target_dominion: &Dominion,
        admin_cap_recipient: address,
        ctx: &mut TxContext,
    ): Command {
        let mut payload = AdminCommand {
            id: object::new(ctx),
            kind: KTransferAdminCap,
            target_dominion_id: object::id(target_dominion),
        };
        dynamic_field::add(
            &mut payload.id,
            TAdminCapRecepient,
            admin_cap_recipient
        );
        dominion.new_command_from_object<DominionAdminCommander, AdminCommand>(
            DominionAdminCommander(),
            payload,
            ctx
        )
    }

    public fun new_enable_commander_command<C: drop>(
        dominion: &Dominion,
        target_dominion: &Dominion,
        ctx: &mut TxContext,
    ): Command {
        let mut payload = AdminCommand {
            id: object::new(ctx),
            kind: KEnableCommander,
            target_dominion_id: object::id(target_dominion),
        };
        dynamic_field::add(
            &mut payload.id,
            TCommander,
            type_name::get<C>(),
        );
        dominion.new_command_from_object<DominionAdminCommander, AdminCommand>(
            DominionAdminCommander(),
            payload,
            ctx,
        )
    }

    public fun new_disable_commander_command<C: drop>(
        dominion: &Dominion,
        target_dominion: &Dominion,
        ctx: &mut TxContext,
    ): Command {
        let commander = type_name::get<C>();
        assert!(
            object::id(dominion) != object::id(target_dominion) ||
            commander != type_name::get<DominionAdminCommander>(),
            EDisablingSelf
        );
        let mut payload = AdminCommand {
            id: object::new(ctx),
            kind: KDisableCommander,
            target_dominion_id: object::id(target_dominion),
        };
        dynamic_field::add(
            &mut payload.id,
            TCommander,
            commander,
        );
        dominion.new_command_from_object<DominionAdminCommander, AdminCommand>(
            DominionAdminCommander(),
            payload,
            ctx,
        )
    }

    public fun new_disable_self_command(
        dominion: &Dominion,
        admin_cap_recepient: address,
        ctx: &mut TxContext,
    ): Command {
        let mut payload = AdminCommand {
            id: object::new(ctx),
            kind: KDisableCommander,
            target_dominion_id: object::id(dominion),
        };
        dynamic_field::add(
            &mut payload.id,
            TCommander,
            type_name::get<DominionAdminCommander>(),
        );
        dynamic_field::add(
            &mut payload.id,
            TAdminCapRecepient,
            admin_cap_recepient,
        );
        dominion.new_command_from_object<DominionAdminCommander, AdminCommand>(
            DominionAdminCommander(),
            payload,
            ctx,
        )
    }

    public fun new_reset_owner_cap_command(
        dominion: &Dominion,
        target_dominion: &Dominion,
        recepient: address,
        ctx: &mut TxContext,
    ): Command {
        let mut payload = AdminCommand {
            id: object::new(ctx),
            kind: KResetOwnerCap,
            target_dominion_id: object::id(target_dominion),
        };
        dynamic_field::add(
            &mut payload.id,
            TOwnerCapRecepient,
            recepient
        );
        dominion.new_command_from_object<DominionAdminCommander, AdminCommand>(
            DominionAdminCommander(),
            payload,
            ctx,
        )
    }

    /*
    public fun destory_command(
        self: AdminCommand
    ) {
        let AdminCommand {
            mut id,
            kind
        } = self;
        if (kind == KEnableCommander || kind == KDisableCommander) {
            dynamic_field::remove<u8, ID>(&mut id, TCommander);
        };
        id.delete()
    }
    */

    public fun execute_transfer_admin_cap(
        executor: Executor,
        dominion: &mut Dominion,
        receiving_admin_cap: Receiving<DominionAdminCap>,
    ): Command {
        let command = executor.payload_object<AdminCommand>();
        assert!(
            command.kind == KTransferAdminCap,
            EInvalidCommandKind 
        );

        let recepient = dynamic_field::borrow<u8, address>(&command.id, TAdminCapRecepient);

        let admin_cap = transfer::public_receive(
            dominion.mut_id<DominionAdminCommander>(DominionAdminCommander()),
            receiving_admin_cap
        );
        assert!(
            admin_cap.dominion_id() == command.target_dominion_id,
            EInvalidTargetDominion,
        );

        transfer::public_transfer(
            admin_cap,
            *recepient
        );

        executor.commit(
            DominionAdminCommander()
        )
    }

    public fun execute_enable_commander(
        executor: Executor,
        dominion: &mut Dominion,
        target_dominion: &mut Dominion,
        receiving_admin_cap: Receiving<DominionAdminCap>,
    ): Command {
        let command = executor.payload_object<AdminCommand>();
        assert!(
            command.kind == KEnableCommander,
            EInvalidCommandKind 
        );
        assert!(
            object::id(target_dominion) == command.target_dominion_id,
            EInvalidTargetDominion,
        );

        let commander = dynamic_field::borrow<u8, TypeName>(&command.id, TCommander);

        if (target_dominion.has_commander(*commander)) {
            return executor.report_error(
                string::utf8(b"Commander is already enabled"),
                DominionAdminCommander(),
            )
        };

        let admin_cap = transfer::public_receive(
            dominion.mut_id<DominionAdminCommander>(DominionAdminCommander()),
            receiving_admin_cap
        );

        target_dominion.enable_commander_by_name(
            *commander,
            &admin_cap,
        );

        transfer::public_transfer(
            admin_cap,
            object::id_address(dominion),
        );

        executor.commit(
            DominionAdminCommander()
        )
    }

    public fun execute_enable_commander_inplace(
        executor: Executor,
        dominion: &mut Dominion,
        receiving_admin_cap: Receiving<DominionAdminCap>,
    ): Command {
        let command = executor.payload_object<AdminCommand>();
        assert!(
            command.kind == KEnableCommander,
            EInvalidCommandKind 
        );
        assert!(
            object::id(dominion) == command.target_dominion_id,
            EInvalidTargetDominion,
        );

        let commander = dynamic_field::borrow<u8, TypeName>(&command.id, TCommander);

        if (dominion.has_commander(*commander)) {
            return executor.report_error(
                string::utf8(b"Commander is already enabled"),
                DominionAdminCommander()
            )
        };

        let admin_cap = transfer::public_receive(
            dominion.mut_id<DominionAdminCommander>(DominionAdminCommander()),
            receiving_admin_cap
        );

        dominion.enable_commander_by_name(
            *commander,
            &admin_cap,
        );

        transfer::public_transfer(
            admin_cap,
            object::id_address(dominion),
        );

        executor.commit(
            DominionAdminCommander()
        )
    }

    public fun execute_disable_commander(
        executor: Executor,
        dominion: &mut Dominion,
        target_dominion: &mut Dominion,
        receiving_admin_cap: Receiving<DominionAdminCap>,
    ): Command {
        let command = executor.payload_object<AdminCommand>();
        assert!(
            command.kind == KDisableCommander,
            EInvalidCommandKind 
        );
        assert!(
            object::id(target_dominion) == command.target_dominion_id,
            EInvalidTargetDominion,
        );

        let commander = dynamic_field::borrow<u8, TypeName>(&command.id, TCommander);

        if (!target_dominion.has_commander(*commander)) {
            return executor.report_error(
                string::utf8(b"Commander is not enabled"),
                DominionAdminCommander()
            )
        };

        let admin_cap = transfer::public_receive(
            dominion.mut_id<DominionAdminCommander>(DominionAdminCommander()),
            receiving_admin_cap
        );

        target_dominion.disable_commander_by_name(
            *commander,
            &admin_cap,
        );

        transfer::public_transfer(
            admin_cap,
            object::id_address(dominion),
        );

        executor.commit(
            DominionAdminCommander()
        )
    }

    public fun execute_disable_commander_inplace(
        executor: Executor,
        dominion: &mut Dominion,
        receiving_admin_cap: Receiving<DominionAdminCap>,
    ): Command {
        let command = executor.payload_object<AdminCommand>();
        assert!(
            command.kind == KDisableCommander,
            EInvalidCommandKind 
        );
        assert!(
            object::id(dominion) == command.target_dominion_id,
            EInvalidTargetDominion,
        );

        let commander = dynamic_field::borrow<u8, TypeName>(&command.id, TCommander);

        if (!dominion.has_commander(*commander)) {
            return executor.report_error<DominionAdminCommander>(
                string::utf8(b"Commander is not enabled"),
                DominionAdminCommander()
            )
        };

        let admin_cap = transfer::public_receive(
            dominion.mut_id<DominionAdminCommander>(DominionAdminCommander()),
            receiving_admin_cap
        );

        dominion.disable_commander_by_name(
            *commander,
            &admin_cap,
        );

        if (commander == type_name::get<DominionAdminCommander>()) {
            let admin_cap_recepient = dynamic_field::borrow<u8, address>(&command.id, TAdminCapRecepient);
            transfer::public_transfer(
                admin_cap,
                *admin_cap_recepient
            );
        } else {
            transfer::public_transfer(
                admin_cap,
                object::id_address(dominion),
            );
        };

        executor.commit<DominionAdminCommander>(
            DominionAdminCommander()
        )
    }

    public fun execute_reset_owner_cap(
        executor: Executor,
        dominion: &mut Dominion,
        target_dominion: &mut Dominion,
        receiving_admin_cap: Receiving<DominionAdminCap>,
        ctx: &mut TxContext,
    ): Command {
        let command = executor.payload_object<AdminCommand>();
        assert!(
            command.kind == KResetOwnerCap,
            EInvalidCommandKind 
        );
        assert!(
            object::id(target_dominion) == command.target_dominion_id,
            EInvalidTargetDominion,
        );

         let recepient = dynamic_field::borrow<u8, address>(&command.id, TOwnerCapRecepient);

        let admin_cap = transfer::public_receive(
            dominion.mut_id<DominionAdminCommander>(DominionAdminCommander()),
            receiving_admin_cap
        );

        let owner_cap = target_dominion.reset_owner_cap(
            &admin_cap,
            ctx,
        );
        transfer::public_transfer(
            owner_cap,
            *recepient
        );

        transfer::public_transfer(
            admin_cap,
            object::id_address(dominion),
        );

        executor.commit<DominionAdminCommander>(
            DominionAdminCommander()
        )
    }

    entry fun create_self_controlled_dominion(
        ctx: &mut TxContext,
    ) {
        let (mut dominion, admin_cap, owner_cap) = dominion::new(
            ctx,
        );
        enable(&mut dominion, &admin_cap);
        transfer::public_transfer(
            admin_cap,
            object::id_address(&dominion),
        );

        transfer::public_transfer(
            owner_cap,
            ctx.sender()
        );

        dominion::commit(dominion);
    }

    #[test_only] use sui::test_scenario::{Self, Scenario};
    #[test_only] use dominion::dominion::DominionOwnerCap;

    #[test_only]
    public fun self_controlled_dominion_for_testing(
        scenario: &mut Scenario,
        next_sender: address,
    ): (Dominion, DominionOwnerCap) {
        let (mut dominion, admin_cap, owner_cap) = dominion::new(
            scenario.ctx(),
        );
        enable(&mut dominion, &admin_cap);
        transfer::public_transfer(
            admin_cap,
            object::id_address(&dominion),
        );
        dominion::commit(dominion);

        scenario.next_tx(next_sender);
        let dominion = scenario.take_shared<Dominion>();

        (dominion, owner_cap)
    }

    #[test]
    fun self_controlled_dominion_creation() {
        let nobody = @0x0;
        let mut scenario = test_scenario::begin(nobody);
    
        let (mut dominion, admin_cap, owner_cap) = dominion::new(
            scenario.ctx(),
        );
        enable(&mut dominion, &admin_cap);
        transfer::public_transfer(
            admin_cap,
            object::id_address(&dominion),
        );
        dominion::commit(dominion);

        scenario.next_tx(nobody);
        let dominion = scenario.take_shared<Dominion>();
        assert!(
            dominion.owner_cap_id() == object::id(&owner_cap),
            0
        );
        assert!(
            owner_cap.dominion_id() == object::id(&dominion),
            1
        );
        assert!(
            dominion.check_commander<DominionAdminCommander>(),
            2
        );
        let admin_cap = scenario.take_from_address_by_id<DominionAdminCap>(
            object::id_address(&dominion),
            dominion.admin_cap_id()
        );
        assert!(
            admin_cap.dominion_id() == object::id(&dominion),
            3
        );

        test_scenario::return_to_address(object::id_address(&dominion), admin_cap);
        transfer::public_freeze_object(owner_cap);

        test_scenario::return_shared(dominion);

        scenario.end();
    }

    #[test]
    fun transfer_admin_cap_from_self_controlled_dominion() {
        let nobody = @0x0;
        let receiver = @0x2874;
        let mut scenario = test_scenario::begin(nobody);
        let (mut dominion, owner_cap) = self_controlled_dominion_for_testing(
            &mut scenario,
            nobody,
        );
        
        let command = new_transfer_admin_cap_command(
            &dominion,
            &dominion,
            receiver,
            scenario.ctx(),
        );
        scenario.next_tx(nobody);
        assert!(
            command.dominion_id() == object::id(&dominion),
            0
        );
        assert!(
            command.check_commander<DominionAdminCommander>(),
            1
        );
        assert!(
            !command.is_executed(),
            2
        );
        assert!(
            command.execution_error().is_none(),
            3
        );
        let payload = command.payload_object<AdminCommand>();
        assert!(
            payload.kind == KTransferAdminCap,
            4
        );
        assert!(
            payload.target_dominion_id == object::id(&dominion),
            5
        );
        assert!(
            dynamic_field::borrow(&payload.id, TAdminCapRecepient) == receiver,
            6
        );
        let command = {
            let executor = dominion.approve(
                command,
                &owner_cap
            );
            let admin_cap_id = dominion.admin_cap_id();
            execute_transfer_admin_cap(
                executor,
                &mut dominion,
                test_scenario::receiving_ticket_by_id<DominionAdminCap>(admin_cap_id),
            )
        };
        scenario.next_tx(nobody);

        assert!(command.is_executed(), 7);
        
        let admin_cap = scenario.take_from_address_by_id<DominionAdminCap>(
            receiver,
            dominion.admin_cap_id()
        );
        test_scenario::return_to_address(receiver, admin_cap);

        transfer::public_freeze_object(command);
        transfer::public_freeze_object(owner_cap);

        test_scenario::return_shared(dominion);

        scenario.end();
    }
}
