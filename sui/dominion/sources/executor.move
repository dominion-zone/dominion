module dominion::executor {
    use std::string::String;
    use dominion::command::Command;
    use dominion::commander_cap::CommanderCap;

    public struct Executor {
        command: Command
    }

    const EWrongCommanderCap: u64 = 0;
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

    public fun commit<T>(
        self: Executor,
        commander_cap: &CommanderCap<T>,
    ): Command {
        let Executor {
            mut command
        } = self;
        assert!(object::id(commander_cap) == command.commander_cap_id(), EWrongCommanderCap);
        command.set_execution_error(option::none());
        command.mark_executed();
        command
    }

    public fun report_error<T>(
        self: Executor,
        error: String,
        commander_cap: &CommanderCap<T>,
    ): Command {
        let Executor {
            mut command
        } = self;
        assert!(object::id(commander_cap) == command.commander_cap_id(), EWrongCommanderCap);
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

    public fun commander_cap_id(self: &Executor): ID {
        self.command.commander_cap_id()
    }

    public fun is_executed(self: &Executor): bool {
        self.command.is_executed()
    }

    public fun execution_error(self: &Executor): Option<String> {
        self.command.execution_error()
    }
}