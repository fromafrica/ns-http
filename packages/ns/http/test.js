const fs = require('fs');
const dnsPacket = require('dns-packet');
const query = dnsPacket.encode({
  type: 'query',
  id: 1, // Random ID
  questions: [{
    type: 'A',
    name: 'fromafri.ca'
  }]
});

fs.writeFileSync('dns-query.bin', query);