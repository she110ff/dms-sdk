import { ClientCore, Context } from "../../client-common";
import { IClientMethods } from "../../interface/IClient";

/**
 * Methods module the SDK Generic Client
 */
export class ClientMethods extends ClientCore implements IClientMethods {
    constructor(context: Context) {
        super(context);
        Object.freeze(ClientMethods.prototype);
        Object.freeze(this);
    }
    public async getMileageBalances(params: any): Promise<any> {
        //TODO : 마일리지를 조회 기능 추가
        return params;
    }
    public async getTokenBalances(params: any): Promise<any> {
        //TODO : 토큰 조회 기능 추가
        return params;
    }
    public async payMileage(params: any): Promise<any> {
        //TODO : 마일리지 사용 승인 기능 추가
        return params;
    }
    public async payToken(params: any): Promise<any> {
        //TODO : 토큰 사용 승인 기능 추가
        return params;
    }
    public async tokenToMileage(params: any): Promise<any> {
        //TODO : 토큰을 마일리지로 전환 기능 추가
        return params;
    }
    public async mileageToToken(params: any): Promise<any> {
        //TODO : 마일리지를 토큰으로 전환 기능 추가
        return params;
    }
    public async deposit(params: any): Promise<any> {
        //TODO : 토큰 입금
        return params;
    }
    public async withdraw(params: any): Promise<any> {
        //TODO : 토큰 출금
        return params;
    }
}
