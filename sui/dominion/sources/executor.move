module dominion::executor {
    use std::type_name::TypeName;
    use std::string::String;
    use dominion::command::Command;

    public struct Executor {
        command: Command
    }

    const EWrongCommander: u64 = 0;
    const ECommandAlreadyExecuted: u64 = 2;

    public(package) fun new(
        command: Command,
    ): Executor {
        assert!(
            !command.is_executed(),
            ECommandAlreadyExecuted
        );
        Executor {
            command,
        }
    }

    public fun command(
        self: &Executor,
    ): &Command {
        &self.command
    }

    public fun commit<C: drop>(
        self: Executor,
        _commander: C,
    ): Command {
        let Executor {
            mut command
        } = self;
        assert!(command.check_commander<C>(), EWrongCommander);
        assert!(
            !command.is_executed(),
            ECommandAlreadyExecuted
        );
        command.mark_executed();
        command
    }

    public fun report_error<C: drop>(
        self: Executor,
        error: String,
        _commander: C,
    ): Command {
        let Executor {
            mut command
        } = self;
        assert!(command.check_commander<C>(), EWrongCommander);
        assert!(
            !command.is_executed(),
            ECommandAlreadyExecuted
        );
        command.set_execution_error(option::some(error));
        command
    }

    public fun payload<P: store>(
        self: &Executor
    ): &P {
        self.command.payload<P>()
    }

    public fun payload_object<P: key + store>(
        self: &Executor
    ): &P {
        self.command.payload_object<P>()
    }

    public fun dominion_id(self: &Executor): ID {
        self.command.dominion_id()
    }

    public fun commander(self: &Executor): TypeName {
        self.command.commander()
    }

    public fun check_commander<C: drop>(self: &Executor): bool {
        self.command.check_commander<C>()
    }

    public fun is_executed(self: &Executor): bool {
        self.command.is_executed()
    }

    public fun execution_error(self: &Executor): Option<String> {
        self.command.execution_error()
    }
}