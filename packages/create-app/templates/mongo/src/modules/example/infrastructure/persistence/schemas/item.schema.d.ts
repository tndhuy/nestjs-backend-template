import { HydratedDocument } from 'mongoose';
export type ItemDocument = HydratedDocument<ItemSchemaClass>;
export declare class ItemSchemaClass {
    _id: string;
    name: string;
}
export declare const ItemSchema: any;
