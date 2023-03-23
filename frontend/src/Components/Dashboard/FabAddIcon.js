//Add new instance
import React from 'react';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import Tooltip from '@material-ui/core/Tooltip';
import InstanceApiService from '../../Services/instance-api-service';
import { useHistory } from "react-router-dom";
import useStyles from '../../styles.js';
import Haikunator from 'haikunator';

function FabAddIcon(props) {
  const classes = useStyles();
  let history = useHistory();

  var haikunator = new Haikunator()


  const clickNewInstance = () => {
    let randomTitle = haikunator.haikunate({tokenLength: 0, delimiter: " "})
      .split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')

    console.log(randomTitle);
    
    InstanceApiService.postNewInstance(randomTitle)
    .then((instance) => {
      history.push(`/instances/${instance.id}`)
    })
  }

  return (
    <Tooltip title="New Instance" placement="top">
      <Fab color="primary" aria-label="add" className={classes.fab} onClick={() => clickNewInstance()}>
        <AddIcon />
      </Fab>
    </Tooltip>
  );
}

export default FabAddIcon;