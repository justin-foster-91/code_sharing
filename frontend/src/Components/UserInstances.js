//Instances of a specific user
import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Container from '@material-ui/core/Container';
import InstanceCard from './InstanceCard';

const UserInstances = (props) => {
  const classes = useStyles();

  const [cardImage, setCardImage] = useState(undefined);

  const [instanceId, setInstanceId] = useState(undefined);

  return (
    <Container className={classes.cardGrid} maxWidth="md">
      <Grid container spacing={4}>
        {props.instances.map((instance) => (  
          <InstanceCard cardImage={cardImage} instance={instance} key={'key ' + instance.id}/>
        ))}
      </Grid>
    </Container>
  );
};

const useStyles = makeStyles((theme) => ({
  cardGrid: {
    paddingTop: theme.spacing(8),
    paddingBottom: theme.spacing(8),
  },
}));

export default UserInstances;
