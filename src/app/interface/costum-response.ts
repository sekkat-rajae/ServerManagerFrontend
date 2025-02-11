import { Server } from "./Server";

export interface CostumResponse{
    timestamp: Date;
    statusCode: number;
    status: string;
    reason: string;
    message: string;
    developperMessage: string;
    data:{servers?: Server[], server?: Server}
}