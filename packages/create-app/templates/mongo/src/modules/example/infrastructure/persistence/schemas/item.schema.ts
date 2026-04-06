import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ItemDocument = HydratedDocument<ItemSchemaClass>;

@Schema({ collection: 'items', timestamps: true })
export class ItemSchemaClass {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true })
  name: string;
}

export const ItemSchema = SchemaFactory.createForClass(ItemSchemaClass);
