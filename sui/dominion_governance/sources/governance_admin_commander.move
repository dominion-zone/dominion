module dominion_governance::governance_admin_commander {
    use sui::dynamic_field;
    use std::string::{Self, String};
    use std::ascii::String as AsciiString;
    use sui::url::{Self, Url};
    use sui::transfer::Receiving;
    use dominion::command::Command;
    use dominion::executor::Executor;
    use dominion::dominion::{Self, Dominion, DominionAdminCap};
    use dominion_governance::governance::{Self, Governance, GovernanceAdminCap, VetoCap};
    use dominion::dominion_admin_commander;

    const EInvalidCommandKind: u64 = 0;
    const EInvalidTargetGovernance: u64 = 1;
    // const EInvalidDominion: u64 = 2;

    const KTransferAdminCap: u8 = 0;
    const KSetName: u8 = 1;
    const KSetLink: u8 = 2;
    const KSetMinWeightToCreateProposal: u8 = 3;
    const KSetVoteThreshold: u8 = 4;

    const TAdminCapRecepient: u8 = 32;
    const TNewName: u8 = 33;
    const TNewLink: u8 = 34;
    const TNewMinWeightToCreateProposal: u8 = 35;
    const TNewVoteThreshold: u8 = 36;

    public struct GovernanceAdminCommander has drop()

    public struct AdminCommand has key, store {
        id: UID,
        kind: u8,
        target_governance_id: ID,
    }

    public entry fun enable(
        dominion: &mut Dominion,
        admin_cap: &DominionAdminCap,
    ) {
        dominion.enable_commander<GovernanceAdminCommander>(
            admin_cap,
        );
    }

    public entry fun disable(
        dominion: &mut Dominion,
        admin_cap: &DominionAdminCap,
    ) {
        dominion.disable_commander<GovernanceAdminCommander>(
            admin_cap,
        );
    }

    public fun new_transfer_admin_cap_command<T>(
        dominion: &Dominion,
        target_governance: &Governance<T>,
        admin_cap_recipient: address,
        ctx: &mut TxContext,
    ): Command {
        let mut payload = AdminCommand {
            id: object::new(ctx),
            kind: KTransferAdminCap,
            target_governance_id: object::id(target_governance),
        };
        dynamic_field::add(
            &mut payload.id,
            TAdminCapRecepient,
            admin_cap_recipient
        );
        dominion.new_command_from_object<GovernanceAdminCommander, AdminCommand>(
            GovernanceAdminCommander(),
            payload,
            ctx
        )
    }

    public fun new_set_name_command<T>(
        dominion: &Dominion,
        target_governance: &Governance<T>,
        new_name: String,
        ctx: &mut TxContext,
    ): Command {
        let mut payload = AdminCommand {
            id: object::new(ctx),
            kind: KSetName,
            target_governance_id: object::id(target_governance),
        };
        dynamic_field::add(
            &mut payload.id,
            TNewName,
            new_name
        );
        dominion.new_command_from_object<GovernanceAdminCommander, AdminCommand>(
            GovernanceAdminCommander(),
            payload,
            ctx
        )
    }

    public fun new_set_link_command<T>(
        dominion: &Dominion,
        target_governance: &Governance<T>,
        new_link: Url,
        ctx: &mut TxContext,
    ): Command {
        let mut payload = AdminCommand {
            id: object::new(ctx),
            kind: KSetLink,
            target_governance_id: object::id(target_governance),
        };
        dynamic_field::add(
            &mut payload.id,
            TNewLink,
            new_link
        );
        dominion.new_command_from_object<GovernanceAdminCommander, AdminCommand>(
            GovernanceAdminCommander(),
            payload,
            ctx
        )
    }

    public fun new_set_min_weight_to_create_proposal_command<T>(
        dominion: &Dominion,
        target_governance: &Governance<T>,
        new_min_weight_to_create_proposal: u64,
        ctx: &mut TxContext,
    ): Command {
        let mut payload = AdminCommand {
            id: object::new(ctx),
            kind: KSetMinWeightToCreateProposal,
            target_governance_id: object::id(target_governance),
        };
        dynamic_field::add(
            &mut payload.id,
            TNewMinWeightToCreateProposal,
            new_min_weight_to_create_proposal
        );
        dominion.new_command_from_object<GovernanceAdminCommander, AdminCommand>(
            GovernanceAdminCommander(),
            payload,
            ctx
        )
    }

    public fun new_set_vote_threshold_command<T>(
        dominion: &Dominion,
        target_governance: &Governance<T>,
        new_vote_threshold: u64,
        ctx: &mut TxContext,
    ): Command {
        let mut payload = AdminCommand {
            id: object::new(ctx),
            kind: KSetVoteThreshold,
            target_governance_id: object::id(target_governance),
        };
        dynamic_field::add(
            &mut payload.id,
            TNewVoteThreshold,
            new_vote_threshold
        );
        dominion.new_command_from_object<GovernanceAdminCommander, AdminCommand>(
            GovernanceAdminCommander(),
            payload,
            ctx
        )
    }

    public fun execute_transfer_admin_cap(
        executor: Executor,
        dominion: &mut Dominion,
        receiving_admin_cap: Receiving<GovernanceAdminCap>,
    ): Command {
        let command = executor.payload_object<AdminCommand>();
        assert!(
            command.kind == KTransferAdminCap,
            EInvalidCommandKind 
        );

        let recepient = dynamic_field::borrow<u8, address>(&command.id, TAdminCapRecepient);

        let admin_cap = transfer::public_receive(
            dominion.mut_id(GovernanceAdminCommander()),
            receiving_admin_cap
        );
        assert!(
            admin_cap.governance_id() == command.target_governance_id,
            EInvalidTargetGovernance,
        );

        transfer::public_transfer(
            admin_cap,
            *recepient
        );

        executor.commit<GovernanceAdminCommander>(
            GovernanceAdminCommander()
        )
    }

    public fun new_self_controlled_dominion_and_governance<T>(
        name: String,
        link: AsciiString,
        min_weight_to_create_proposal: u64,
        vote_threshold: u64,
        max_voting_time: u64,
        ctx: &mut TxContext
    ): (Dominion, Governance<T>, VetoCap) {
        let (
            mut dominion,
            dominion_admin_cap,
            dominion_owner_cap
        ) = dominion::new(ctx);

        // Install extensions
        dominion_admin_commander::enable(
            &mut dominion,
            &dominion_admin_cap,
        );
        enable(
            &mut dominion,
            &dominion_admin_cap,
        );

        let (
            governance,
            governance_admin_cap,
            veto_cap
        ) = governance::new<T>(
            &mut dominion,
            dominion_owner_cap,
            name,
            url::new_unsafe(link),
            min_weight_to_create_proposal,
            vote_threshold,
            max_voting_time,
            ctx
        );

        // Set up self control
        transfer::public_transfer(
            dominion_admin_cap,
            object::id_address(&dominion),
        );
        transfer::public_transfer(
            governance_admin_cap,
            object::id_address(&dominion),
        );

        (dominion, governance, veto_cap)
    }

    entry fun create_self_controlled_dominion_and_governance<T>(
        name: String,
        link: AsciiString,
        min_weight_to_create_proposal: u64,
        vote_threshold: u64,
        max_voting_time: u64,
        ctx: &mut TxContext
    ) {
        let (
            dominion,
            governance,
            veto_cap
        ) = new_self_controlled_dominion_and_governance<T>(
            name,
            link,
            min_weight_to_create_proposal,
            vote_threshold,
            max_voting_time,
            ctx 
        );

        // Share objects
        dominion::commit(dominion);
        governance::commit(governance);

        // Send veto cap
        transfer::public_transfer(
            veto_cap,
            ctx.sender(),
        );
    }
}