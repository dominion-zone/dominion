module dominion::commander_cap {
    const EBadWitness: u64 = 0;

    public struct CommanderCap<phantom T> has key, store {
        id: UID,
    }

    public fun new<T: drop>(
        witness: T,
        ctx: &mut TxContext
    ): CommanderCap<T> {
        assert!(sui::types::is_one_time_witness(&witness), EBadWitness);
        return CommanderCap<T> {
            id: object::new(ctx)
        }
    }
}
