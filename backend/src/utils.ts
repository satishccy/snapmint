import { Algodv2,Indexer } from "algosdk";
import algosdk from "algosdk";

const algodClient = new Algodv2(
  process.env.ALGOD_TOKEN!,
  process.env.ALGOD_SERVER!,
  Number(process.env.ALGOD_PORT!)
);

const indexerClient = new Indexer(
    process.env.INDEXER_TOKEN!,
    process.env.INDEXER_SERVER!,
    Number(process.env.INDEXER_PORT!)
);

const feePoolMnemonic = process.env.FEE_POOL_MNEMONIC!;
const feePoolAccount = algosdk.mnemonicToSecretKey(feePoolMnemonic);

export { algodClient, indexerClient, feePoolAccount };
