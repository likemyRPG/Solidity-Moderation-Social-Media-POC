import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, List, ListItem, Divider, Grid, Tooltip, TextField, MenuItem } from '@mui/material';
import Web3 from 'web3';
import contractData from '../contracts/ContentContract.json';
import { AbiItem } from 'web3-utils';

interface IBlockchainEvent {
  event: string;
  blockNumber: number;
  timestamp: string;
  transactionHash: string;
  returnValues: {
    [key: string]: any;
  };
}

interface BlockchainActivityLogProps {
  web3: Web3;
}

const BlockchainActivityLog: React.FC<BlockchainActivityLogProps> = ({ web3 }) => {
  const [events, setEvents] = useState<IBlockchainEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<IBlockchainEvent[]>([]);
  const [filter, setFilter] = useState('');

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
        const formattedEvents: IBlockchainEvent[] = await Promise.all(eventList.map(async (event) => {
          const block: any = await web3.eth.getBlock(event.blockNumber);
          return {
            event: event.event,
            blockNumber: event.blockNumber,
            timestamp: new Date(block.timestamp * 1000).toLocaleString(),
            transactionHash: event.transactionHash,
            returnValues: event.returnValues,
          };
        }));
        setEvents(formattedEvents);
        setFilteredEvents(formattedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, [web3]);

  useEffect(() => {
    if (filter) {
      const lowerCaseFilter = filter.toLowerCase();
      const filtered = events.filter(event => event.event.toLowerCase().includes(lowerCaseFilter));
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents(events);
    }
  }, [filter, events]);

  return (
    <Card sx={{ margin: 2, width: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Blockchain Activity Log
        </Typography>
        <TextField
          fullWidth
          label="Filter Events"
          variant="outlined"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ marginBottom: 2 }}
        />
        <List sx={{ width: '100%' }}>
          {filteredEvents.map((event, index) => (
            <React.Fragment key={index}>
              <ListItem>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1">{event.event}</Typography>
                    <Typography variant="body2" color="textSecondary">Block: {event.blockNumber}</Typography>
                    <Typography variant="body2">Timestamp: {event.timestamp}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Tooltip title={event.transactionHash} placement="bottom" arrow>
                      <Typography variant="body2" noWrap>Transaction Hash: {`${event.transactionHash.substring(0, 30)}...`}</Typography>
                    </Tooltip>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      Data: {Object.entries(event.returnValues).map(([key, value]) => `${key}: ${value}`).join(', ')}
                    </Typography>
                  </Grid>
                </Grid>
              </ListItem>
              {index < filteredEvents.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default BlockchainActivityLog;
