export type ToggleCommanderAction =
  | {
      type: "enableCommander";
      commander: string;
    }
  | {
      type: "disableCommander";
      commander: string;
    };

export type TransferCoinAction = {
  type: "transferCoin";
  coinType: string;
  recipient: string;
  amount: string;
};

export type Action = ToggleCommanderAction | TransferCoinAction;
