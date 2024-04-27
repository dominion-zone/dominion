module dominion::command {
    use std::string::String;
    use dominion::commander_cap::CommanderCap;
    use sui::{dynamic_field, dynamic_object_field};

    const TPayload: u8 = 0;
    const TObjectPayload: u8 = 1;

    public struct Command has key, store {
        id: UID,
        dominion_id: ID,
        commander_cap_id: ID,
        is_executed: bool,
        execution_error: Option<String>,
    }

    public(package) fun new<T, P: store>(
        dominion_id: ID,
        payload: P,
        commander_cap: &CommanderCap<T>,
        ctx: &mut TxContext,
    ): Command {
        let mut self = Command {
            id: object::new(ctx),
            dominion_id,
            commander_cap_id: object::id(commander_cap),
            is_executed: false,
            execution_error: option::none(),
        };
        dynamic_field::add(&mut self.id, TPayload, payload);
        self
    }

    public(package) fun new_from_object<T, P: key + store>(
        dominion_id: ID,
        payload: P,
        commander_cap: &CommanderCap<T>,
        ctx: &mut TxContext,
    ): Command {
        let mut self = Command {
            id: object::new(ctx),
            dominion_id,
            commander_cap_id: object::id(commander_cap),
            is_executed: false,
            execution_error: option::none(),
        };
        dynamic_object_field::add(&mut self.id, TObjectPayload, payload);
        self
    }

    public fun payload<P: store>(
        self: &Command
    ): &P {
        dynamic_field::borrow(&self.id, TPayload)
    }

    public fun payload_object<P: key + store>(
        self: &Command
    ): &P {
        dynamic_object_field::borrow(&self.id, TObjectPayload)
    }

    public fun into_inner<P: store>(
        self: Command,
    ): P {
        let Command {
            mut id,
            dominion_id: _,
            commander_cap_id: _,
            is_executed: _,
            execution_error: _,
        } = self;
        let payload = dynamic_field::remove(&mut id, TPayload);
        id.delete();
        payload
    }

    public fun into_inner_object<P: key + store>(
        self: Command,
    ): P {
        let Command {
            mut id,
            dominion_id: _,
            commander_cap_id: _,
            is_executed: _,
            execution_error: _,
        } = self;
        let payload = dynamic_object_field::remove(&mut id, TObjectPayload);
        id.delete();
        payload
    }

    public(package) fun mark_executed(self: &mut Command) {
        self.is_executed = true;
    }

    public(package) fun set_execution_error(
        self: &mut Command,
        error: Option<String>
    ) {
        self.execution_error = error;
    }

    public fun dominion_id(self: &Command): ID {
        self.dominion_id
    }

    public fun commander_cap_id(self: &Command): ID {
        self.commander_cap_id
    }

    public fun is_executed(self: &Command): bool {
        self.is_executed
    }

    public fun execution_error(self: &Command): Option<String> {
        self.execution_error
    }
}
