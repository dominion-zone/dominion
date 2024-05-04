// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

/// Example coin with a trusted owner responsible for minting/burning (e.g., a stablecoin)
module test_coin::test_coin {
    use sui::coin::{Self, Coin, TreasuryCap};

    /// Name of the coin
    public struct TEST_COIN has drop {}

    public struct Control has key {
        id: UID,
        treasury_cap: TreasuryCap<TEST_COIN>
    }

    /// Register the trusted currency to acquire its `TreasuryCap`. Because
    /// this is a module initializer, it ensures the currency only gets
    /// registered once.
    fun init(witness: TEST_COIN, ctx: &mut TxContext) {
        // Get a treasury cap for the coin and give it to the transaction
        // sender
        let (treasury_cap, metadata) = coin::create_currency<TEST_COIN>(
            witness,
            9,
            b"Test",
            b"",
            b"",
            option::none(),
            ctx
        );
        transfer::public_freeze_object(metadata);
        transfer::share_object(
            Control {
                id: object::new(ctx),
                treasury_cap
            }
        );
    }

    public fun mint_coin(
        amount: u64,
        control: &mut Control,
        ctx: &mut TxContext
    ): Coin<TEST_COIN>
    {
        coin::mint<TEST_COIN>(
            &mut control.treasury_cap,
            amount,
            ctx
        )
    }

    entry fun mint(amount: u64, control: &mut Control, ctx: &mut TxContext) {
        let coin = mint_coin(
            amount,
            control,
            ctx
        );
        transfer::public_transfer(coin, tx_context::sender(ctx));
    }

    #[test_only]
    /// Wrapper of module initializer for testing
    public fun test_init(ctx: &mut TxContext) {
        init(TEST_COIN {}, ctx)
    }
}
