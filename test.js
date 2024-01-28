import fs from 'fs'
import dnsPacket from 'dns-packet'

const query = dnsPacket.encode({
  type: 'query',
  id: 1, // Random ID
  questions: [{
    type: 'CNAME',
    name: 'rio.fromafri.ca'
  }]
})

fs.writeFileSync('dns-query.bin', query)