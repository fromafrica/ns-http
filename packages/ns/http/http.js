const dnsPacket = require('dns-packet');


export default function main(event) {
  try {
      // Decode the DNS query from the HTTP request body (assuming Base64-encoded)
      const dnsQueryBuffer = Buffer.from(event.body, 'base64');
      const query = dnsPacket.decode(dnsQueryBuffer);

      let dnsResponse;
      if (query.questions && query.questions[0].name === 'www.chinook.app') {
          // Respond authoritatively for www.chinook.app
          dnsResponse = dnsPacket.encode({
              type: 'response',
              id: query.id,
              questions: query.questions,
              flags: dnsPacket.AUTHORITATIVE_ANSWER,
              answers: [{
                  type: 'A',
                  class: 'IN',
                  name: 'www.chinook.app',
                  ttl: 300,
                  data: '192.0.2.123'
              }],
          });
      } else {
          // For other domains, return NXDOMAIN
          dnsResponse = dnsPacket.encode({
              type: 'response',
              id: query.id,
              questions: query.questions,
              flags: 3 // NXDOMAIN flag
          });
      }

      // Encode the DNS response and send it back in the HTTP response (Base64-encoded)
      return {
          statusCode: 200,
          headers: { 'Content-Type': 'text/plain' },
          body: Buffer.from(dnsResponse).toString('base64')
      };
  } catch (error) {
      console.error('Error handling DNS query:', error);
      return { statusCode: 500, body: 'Internal Server Error' };
  }
}