export interface Operation<ResultT> {
  id: string;
  done: boolean;
  result?: ResultT | OperationError;
}

interface OperationError {
  code: string;
  message: string;
}
