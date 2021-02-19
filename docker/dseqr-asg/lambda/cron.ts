const findRemoveSync = require("./findRemoveSync.js");

exports.handler = async (event: any, context: any, callback: Function) => {
  // delete fastq.gz files older than 24 hours
  // delete output.bus (scRNA-seq) files older than 24 hours
  // delete abundance.tsv/h5 (RNA-seq) files older than 24 hours
  var result = findRemoveSync("/mnt/dseqr", {
    extensions: [".fastq.gz"],
    files: ["output.bs", "abundance.tsv", "abundance.h5"],
  });

  console.log("Deleted files:", JSON.stringify(result, null, 2));
};
