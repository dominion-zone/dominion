module dominion::command {
    use std::type_name::{Self, TypeName};
    use std::string::String;
    use sui::{dynamic_field, dynamic_object_field};

    const TPayload: u8 = 0;
    const TObjectPayload: u8 = 1;

    public struct Command has key, store {
        id: UID,
        dominion_id: ID,
        commander: TypeName,
        is_executed: bool,
        execution_error: Option<String>,
    }

    public(package) fun new<C: drop, P: store>(
        dominion_id: ID,
        _commander: C,
        payload: P,
        ctx: &mut TxContext,
    ): Command {
        let mut self = Command {
            id: object::new(ctx),
            dominion_id,
            commander: type_name::get<C>(),
            is_executed: false,
            execution_error: option::none(),
        };
        dynamic_field::add(&mut self.id, TPayload, payload);
        self
    }

    public(package) fun new_from_object<C: drop, P: key + store>(
        dominion_id: ID,
        _commander: C,
        payload: P,
        ctx: &mut TxContext,
    ): Command {
        let mut self = Command {
            id: object::new(ctx),
            dominion_id,
            commander: type_name::get<C>(),
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
            commander: _,
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
            commander: _,
            is_executed: _,
            execution_error: _,
        } = self;
        let payload = dynamic_object_field::remove(&mut id, TObjectPayload);
        id.delete();
        payload
    }

    public fun destroy<P: store + drop>(
        self: Command,
    ) {
        let Command {
            mut id,
            dominion_id: _,
            commander: _,
            is_executed: _,
            execution_error: _,
        } = self;
        dynamic_field::remove<u8, P>(&mut id, TPayload);
        id.delete();
    }

    public fun destroy_object<P: key + store + drop>(
        self: Command,
    ) {
        let Command {
            mut id,
            dominion_id: _,
            commander: _,
            is_executed: _,
            execution_error: _,
        } = self;
        dynamic_field::remove<u8, P>(&mut id, TObjectPayload);
        id.delete();
    }

    public(package) fun mark_executed(self: &mut Command) {
        self.execution_error = option::none();
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

    public fun commander(self: &Command): TypeName {
        self.commander
    }

    public fun check_commander<C: drop>(self: &Command): bool {
        self.commander == type_name::get<C>()
    }

    public fun is_executed(self: &Command): bool {
        self.is_executed
    }

    public fun execution_error(self: &Command): Option<String> {
        self.execution_error
    }
}
