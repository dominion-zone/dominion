module framework_commander::coin_commander {
    use dominion::command::Command;
    use dominion::executor::Executor;
    use dominion::dominion::{Dominion, DominionAdminCap};
    use sui::dynamic_field;
    use sui::transfer::Receiving;
    use sui::coin::Coin;

    const EInvalidCommandKind: u64 = 0;

    const KTransfer: u8 = 0;
    // const KBorrow: u8 = 1;

    const TRecepient: u8 = 0;
    const TAmount: u8 = 1;

    public struct CoinCommander has drop()

    public struct CoinCommand<phantom C>  has key, store {
        id: UID,
        kind: u8,
    }

    public entry fun enable(
        dominion: &mut Dominion,
        admin_cap: &DominionAdminCap,
    ) {
        dominion.enable_commander<CoinCommander>(
            admin_cap,
        );
    }

    public entry fun disable(
        dominion: &mut Dominion,
        admin_cap: &DominionAdminCap,
    ) {
        dominion.disable_commander<CoinCommander>(
            admin_cap,
        );
    }

    public fun new_transfer_command<C>(
        dominion: &Dominion,
        recipient: address,
        amount: u64,
        ctx: &mut TxContext,
    ): Command {
        let mut payload = CoinCommand<C> {
            id: object::new(ctx),
            kind: KTransfer,
        };
        dynamic_field::add(
            &mut payload.id,
            TRecepient,
            recipient
        );
        dynamic_field::add(
            &mut payload.id,
            TAmount,
            amount
        );
        dominion.new_command_from_object<CoinCommander, CoinCommand<C>>(
            CoinCommander(),
            payload,
            ctx
        )
    }

    public fun execute_transfer<C>(
        executor: Executor,
        dominion: &mut Dominion,
        receiving_coin: Receiving<Coin<C>>,
        ctx: &mut TxContext,
    ): Command {
        let command = executor.payload_object<CoinCommand<C>>();
        assert!(
            command.kind == KTransfer,
            EInvalidCommandKind 
        );

        let recepient = dynamic_field::borrow<u8, address>(&command.id, TRecepient);
        let amount = dynamic_field::borrow<u8, u64>(&command.id, TAmount);

        let mut coin = transfer::public_receive(
            dominion.mut_id(CoinCommander()),
            receiving_coin
        );

        transfer::public_transfer(
            coin.split(*amount, ctx),
            *recepient
        );

        if (coin.value() > 0) {
            transfer::public_transfer(
                coin,
                object::id_address(dominion),
            );
        } else {
            coin.destroy_zero();
        };

        executor.commit<CoinCommander>(
            CoinCommander()
        )
    }

    public entry fun join_coins<C>(
        dominion: &mut Dominion,
        receiving_coin_a: Receiving<Coin<C>>,
        receiving_coin_b: Receiving<Coin<C>>,
    ) {
        let mut coin_a = transfer::public_receive(
            dominion.mut_id(CoinCommander()),
            receiving_coin_a
        );

        let coin_b = transfer::public_receive(
            dominion.mut_id(CoinCommander()),
            receiving_coin_b
        );

        coin_a.join(coin_b);

        transfer::public_transfer(
            coin_a,
            object::id_address(dominion),
        );
    }

    public entry fun deposit<C>(
        dominion: &mut Dominion,
        receiving_coin: Receiving<Coin<C>>,
        additional: Coin<C>
    ) {
        let mut coin = transfer::public_receive(
            dominion.mut_id(CoinCommander()),
            receiving_coin
        );

        coin.join(additional);

        transfer::public_transfer(
            coin,
            object::id_address(dominion),
        );
    }
}