import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TestData, TestDataDocument } from './shared/schemas/test.schema';

@Injectable()
export class TestDataService {
  constructor(
    @InjectModel(TestData.name)
    private testDataModel: Model<TestDataDocument>,
  ) {}
  getTestData() {
    return this.testDataModel.find();
  }
}
