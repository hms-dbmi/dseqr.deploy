const util = require("util");
const exec = util.promisify(require("child_process").exec);

exports.handler = async (event: any, context: any, callback: Function) => {
  // every hour delete fastq.gz files older than 24 hours
  // every hour delete output.bus (scRNA-seq) files older than 24 hours
  // every hour delete abundance.tsv/h5 (RNA-seq) files older than 24 hours
  await exec("find /mnt/dseqr -name *.fastq.gz -type f -mmin +360 -delete");
  await exec("find /mnt/dseqr -name output.bus -type f -mmin +360 -delete");
  await exec("find /mnt/dseqr -name 'abundance.*' -type f -mmin +360 -delete");
};
