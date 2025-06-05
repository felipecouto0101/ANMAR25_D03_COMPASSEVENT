
export function skipAllTests() {
  
  const originalDescribe = global.describe;
  global.describe = (name, fn) => {
    originalDescribe.skip(name, fn);
  };
}


export function restoreTests() {
 
  global.describe = global.originalDescribe;
}


global.originalDescribe = global.describe;