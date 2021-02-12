exports.handler = (event: any, context: any, callback: Function) => {
  callback(null, {
    statusCode: 200,
    statusDescription: "OK",
    isBase64Encoded: false,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*",
    },
  });
};
