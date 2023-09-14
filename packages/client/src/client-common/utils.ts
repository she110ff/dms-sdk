import { Log } from "@ethersproject/providers";
import { ContractReceipt } from "@ethersproject/contracts";
import { Interface } from "@ethersproject/abi";
import { id } from "@ethersproject/hash";

export function findLog(receipt: ContractReceipt, iface: Interface, eventName: string): Log | undefined {
    return receipt.logs.find((log) => log.topics[0] === id(iface.getEvent(eventName).format("sighash")));
}
