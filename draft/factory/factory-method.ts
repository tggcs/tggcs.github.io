class Operation {
  NumA = 0
  NumB = 0

  GetResult() {
    return 0
  }
}

interface IFactory {
  CreateOperate();
}

class AddFactory implements IFactory {
  CreateOperate() {
    return new OperationAdd()
  }
}
class SubFactory implements IFactory {
  CreateOperate() {
    return new OperationSub()
  }
}
class MulFactory implements IFactory {
  CreateOperate() {
    return new OperationMul()
  }
}
class DivFactory implements IFactory {
  CreateOperate() {
    return new OperationDiv()
  }
}

class OperationAdd extends Operation {
  GetResult() {
    return this.NumA + this.NumB
  }
}

class OperationSub extends Operation {
  GetResult() {
    return this.NumA - this.NumB
  }
}

class OperationMul extends Operation {
  GetResult() {
    return this.NumA * this.NumB
  }
}

class OperationDiv extends Operation {
  GetResult() {
    return this.NumA / this.NumB
  }
}

// class OperationFactory {
//   public static createOperate(operate) {
//     let oper: Operation | null = null
//     switch (operate) {
//       case "+":
//         oper = new OperationAdd()
//         break;
//       case "-":
//         oper = new OperationSub()
//         break;
//       case "*":
//         oper = new OperationMul()
//         break;
//       case "/":
//         oper = new OperationDiv()
//         break;
//     }
//     return oper
//   }
// }

const use = () => {
  // const oper = OperationFactory.createOperate("+")
  // oper!.NumA = 1
  // oper!.NumB = 2
  // const res = oper?.GetResult()
  // console.log(res)
  const fac = new AddFactory()
  const oper = fac.CreateOperate()
  oper!.NumA = 1
  oper!.NumB = 2
  const res = oper?.GetResult()
  console.log(res)
}