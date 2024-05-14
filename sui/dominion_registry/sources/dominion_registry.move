/// Module: dominion_registry
module dominion_registry::dominion_registry {
    use std::string::String;
    use dominion::dominion::Dominion;

    const EInvalidOwnerCap: u64 = 0;
    const EDominionAlreadyPresent: u64 = 1;
    const EUrlNameAlreadyPresent: u64 = 2;

    public struct Entry has store, drop {
        dominion_id: ID,
        url_name: String,
    }

    public struct DominionRegistry has key {
        id: UID,
        owner_cap_id: ID,
        policy_address: address,
        entries: vector<Entry>,
    }

    public struct OwnerCap has key, store {
        id: UID,
        registry_id: ID,
    }

    public fun new(
        ctx: &mut TxContext
    ): (DominionRegistry, OwnerCap) {
        let owner_cap_uid = object::new(ctx);

        let self = DominionRegistry {
            id: object::new(ctx),
            owner_cap_id: owner_cap_uid.to_inner(),
            policy_address: owner_cap_uid.to_address(),
            entries: vector::empty(),
        };

        let onwer_cap = OwnerCap {
            id: owner_cap_uid,
            registry_id: object::id(&self),
        };

        (self, onwer_cap)
    }

    #[allow(lint(share_owned))]
    public fun commit(self: DominionRegistry) {
        transfer::share_object(self);
    }

    public fun owner_cap_id(self: &DominionRegistry): ID {
        self.owner_cap_id
    }

    public fun policy_address(self: &DominionRegistry): address {
        self.policy_address
    }

    public fun set_policy_address(
        self: &mut DominionRegistry,
        owner_cap: &OwnerCap,
        policy_address: address,
    ) {
        assert!(
            object::id(owner_cap) == self.owner_cap_id,
            EInvalidOwnerCap,
        );
        self.policy_address = policy_address;
    }

    public fun entry_count(self: &DominionRegistry): u64 {
        self.entries.length()
    }

    public fun dominion_id(
        self: &DominionRegistry,
        i: u64,
    ): ID {
        self.entries[i].dominion_id
    }

    public fun url_name(
        self: &DominionRegistry,
        i: u64,
    ): String {
        self.entries[i].url_name
    }

    public fun registry_id(self: &OwnerCap): ID {
        self.registry_id
    }

    public fun insert_entry(
        self: &mut DominionRegistry,
        index: u64,
        dominion: &Dominion,
        url_name: String,
        owner_cap: &OwnerCap,
    ) {
        assert!(
            object::id(owner_cap) == self.owner_cap_id,
            EInvalidOwnerCap,
        );
        let dominion_id = object::id(dominion);
        let mut i = 0;
        let n = self.entries.length();
        while (i < n) {
            assert!(
                self.entries[i].dominion_id != dominion_id,
                EDominionAlreadyPresent,
            );

            if (!url_name.is_empty()) {
                assert!(
                    self.entries[i].url_name != url_name,
                    EUrlNameAlreadyPresent,
                );
            };
            i = i + 1;
        };

        self.entries.insert(
            Entry {
                dominion_id,
                url_name,
            },
            index
        );
    }

    public fun update_entry(
        self: &mut DominionRegistry,
        dominion: &Dominion,
        url_name: String,
        owner_cap: &OwnerCap,
    ) {
        assert!(
            object::id(owner_cap) == self.owner_cap_id,
            EInvalidOwnerCap,
        );
        let dominion_id = object::id(dominion);
        let mut i = 0;
        let n = self.entries.length();
        while (i < n) {
            if (self.entries[i].dominion_id == dominion_id) {
                self.entries[i].url_name = url_name;
            } else if (!url_name.is_empty()) {
                assert!(
                    self.entries[i].url_name != url_name,
                    EUrlNameAlreadyPresent,
                );
            };
            i = i + 1;
        }
    }

    public fun remove_entry(
        self: &mut DominionRegistry,
        dominion: &Dominion,
        owner_cap: &OwnerCap,
    ) {
        assert!(
            object::id(owner_cap) == self.owner_cap_id,
            EInvalidOwnerCap,
        );
        let dominion_id = object::id(dominion);
        let mut i = 0;
        let n = self.entries.length();
        while (i < n) {
            if (self.entries[i].dominion_id == dominion_id) {
                self.entries.remove(i);
                break
            };
            i = i + 1;
        }
    }
}

