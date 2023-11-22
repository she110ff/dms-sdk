import { IClientCore, IClientHttpCore } from "../client-common";
import { PhoneLinkRegisterStepValue, PhoneLinkSubmitStepValue } from "../interfaces";

export interface IPhoneLink {
    link: IPhoneLinkMethods;
}

/** Defines the shape of the general purpose Client class */
export interface IPhoneLinkMethods extends IClientCore, IClientHttpCore {
    toAddress: (phone: string) => Promise<string>;
    toPhoneNumber: (address: string) => Promise<string>;
    register: (phone: string) => AsyncGenerator<PhoneLinkRegisterStepValue>;
    submit: (requestId: string, code: string) => AsyncGenerator<PhoneLinkSubmitStepValue>;
    getRegisterStatus: (id: string) => Promise<number>;
}
