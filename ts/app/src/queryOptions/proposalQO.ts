export type Action = {
  type: 'enableCommander';
  commander: string;
} | {
  type: 'disableCommander';
  commander: string;
} | {
  type: 'transferCoin';
  recipient: string;
  amount: string;
};