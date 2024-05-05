import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, List, ListItem, Divider } from '@mui/material';
import Web3 from 'web3';
import contractData from '../contracts/ContentContract.json';
import { AbiItem } from 'web3-utils';

interface IBlockchainEvent {
  event: string;
  blockNumber: number;
  returnValues: {
    [key: string]: any;
  };
}

interface BlockchainActivityLogProps {
  web3: Web3;
}

const BlockchainActivityLog: React.FC<BlockchainActivityLogProps> = ({ web3 }) => {
  const [events, setEvents] = useState<IBlockchainEvent[]>([]);

  useEffect(() => {
    const networkId = '5777';
    const abi: AbiItem[] = contractData.abi as AbiItem[];
    const ContentContract = new web3.eth.Contract(abi, contractData.networks[networkId].address);

    const fetchEvents = async () => {
      try {
        const eventList = await ContentContract.getPastEvents('AllEvents', {
          fromBlock: 0,
          toBlock: 'latest'
        });
        console.log(eventList);
        // Mapping raw event data to IBlockchainEvent format, if necessary
        const formattedEvents: IBlockchainEvent[] = eventList.map(event => ({
          event: event.event,
          blockNumber: event.blockNumber,
          returnValues: event.returnValues,
        }));
        setEvents(formattedEvents);
      } catch ( error ) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, [web3]);

  return (
    <Card sx={{ margin: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Blockchain Activity Log
        </Typography>
        <List>
          {events.map((event, index) => (
            <React.Fragment key={index}>
              <ListItem>
                <Typography variant="body2">
                  {`Event: ${event.event}, Block: ${event.blockNumber}, Data: ${JSON.stringify(event.returnValues)}`}
                </Typography>
              </ListItem>
              {index < events.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default BlockchainActivityLog;
