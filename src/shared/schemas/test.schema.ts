import { Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema({ collection: 'test' })
export class TestData {
  value: string;
}

export const TestDataSchema = SchemaFactory.createForClass(TestData);

export type TestDataDocument = TestData & mongoose.Document;
