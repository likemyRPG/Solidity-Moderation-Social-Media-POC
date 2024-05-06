import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, List, ListItem, Divider, Grid, Tooltip, TextField, Box } from '@mui/material';
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
  const [filters, setFilters] = useState({
    event: '',
    author: ''
  });

  const addEvents = (newEvents) => {
    setEvents(prevEvents => [...newEvents, ...prevEvents]);
  };  

  let contentCreatedSubscription: any;
  let contentFlaggedSubscription: any;
  let scoreUpdatedSubscription: any;

  const setupEventListeners = (contract) => {
    contentCreatedSubscription = contract.events.ContentCreated({
      fromBlock: 'latest'
    })
    .on('data', event => {
      formatEvent(event).then(formattedEvent => {
        addEvents([formattedEvent]);
      }).catch(console.error);
    })
    .on('error', console.error);
  
    contentFlaggedSubscription = contract.events.ContentFlagged({
      fromBlock: 'latest'
    })
    .on('data', event => {
      formatEvent(event).then(formattedEvent => {
        addEvents([formattedEvent]);
      }).catch(console.error);
    });
  
    scoreUpdatedSubscription = contract.events.ScoreUpdated({
      fromBlock: 'latest'
    })
    .on('data', event => {
      formatEvent(event).then(formattedEvent => {
        addEvents([formattedEvent]);
      }).catch(console.error);
    });
  };
  

  const formatEvent = async (event) => {
    const block: any = await web3.eth.getBlock(event.blockNumber);
    return {
      event: event.event,
      blockNumber: event.blockNumber,
      timestamp: new Date(block.timestamp * 1000).toLocaleString(),
      transactionHash: event.transactionHash,
      returnValues: event.returnValues,
      isNew: true
    };
  };
  
  const clearNewFlags = () => {
    setEvents(prevEvents => prevEvents.map(event => ({ ...event, isNew: false })));
  };
  
  useEffect(() => {
    const interval = setInterval(clearNewFlags, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const networkId = '5777'; // Ensure this is correct
    const abi: AbiItem[] = contractData.abi as AbiItem[];
    const contractAddress = contractData.networks[networkId]?.address;
    if (!contractAddress) {
      console.error('Contract address not found for the network ID:', networkId);
      return;
    }
  
    const ContentContract = new web3.eth.Contract(abi, contractAddress);
  
    const fetchEvents = async () => {
      try {
        const eventList = await ContentContract.getPastEvents('AllEvents', {
          fromBlock: 0,
          toBlock: 'latest'
        });
        const formattedEvents = await Promise.all(eventList.map(formatEvent));
        // Sort by block number in descending order
        formattedEvents.sort((a, b) => b.blockNumber - a.blockNumber);
        addEvents(formattedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };    
    
  
    fetchEvents();
    setupEventListeners(ContentContract);
  
    return () => {
      contentCreatedSubscription.unsubscribe();
      contentFlaggedSubscription.unsubscribe();
      scoreUpdatedSubscription.unsubscribe();
    };
  }, [web3]);
  

  useEffect(() => {
    const results = events.filter(event =>
      (event.event.toLowerCase().includes(filters.event.toLowerCase()) || !filters.event) &&
      (event.returnValues.author?.toLowerCase().includes(filters.author.toLowerCase()) || !filters.author)
    );
    setFilteredEvents(results);
  }, [filters, events]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };

  return (
    <Card sx={{ margin: 2, width: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Blockchain Activity Log
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, marginBottom: 2 }}>
          <TextField
            label="Filter by Event"
            variant="outlined"
            name="event"
            value={filters.event}
            onChange={handleFilterChange}
          />
          <TextField
            label="Filter by Author"
            variant="outlined"
            name="author"
            value={filters.author}
            onChange={handleFilterChange}
          />
        </Box>
        <List sx={{ width: '100%' }}>
          {filteredEvents.map((event: any, index) => (
            <React.Fragment key={index}>
              <ListItem sx={{ bgcolor: event.isNew ? 'rgba(0, 255, 0, 0.1)' : 'inherit' }}>
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
