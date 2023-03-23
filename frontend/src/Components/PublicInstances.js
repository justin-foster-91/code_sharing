//The crap we wanna share
import React, { useEffect, useState } from 'react';
import Title from './Dashboard/Title';
import InstanceApiService from '../Services/instance-api-service';
import UserInstances from './UserInstances';
import Pagination from '@material-ui/lab/Pagination';
import {SearchBar} from '../Util.js'
import useStyles from '../styles.js';

export default function PublicInstances(props) {
  // console.log("From index: ", props);
  const [instances, setInstances] = useState([])
  const classes = useStyles();
  const [rowsPerPage, setRowsPerPage] = React.useState(9);
  const [totalInstances, setTotalInstances] = React.useState(0);
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = React.useState('');

  useEffect(() => {
    let isMounted = true
    InstanceApiService.getPublicInstances(currentPage, search)
      .then(instances => {
        if(isMounted){
          setInstances(instances.instances)
          setTotalInstances(instances.total)
        }
      })
    return () => {
      isMounted = false
    }
  }, [currentPage, search])

  return (
    <>
      <div className={classes.headBar}>
        <div className={classes.headLeft}></div>
        <div className={classes.headTitle}>Public Instances</div>
        <div className={classes.headRight}><SearchBar setSearch={setSearch} setCurrentPage={setCurrentPage}/></div>
      </div>
      <UserInstances instances={instances}/>
      <Title>
          <div className={classes.publicInstancesRoot}>
            <Pagination count={Math.ceil(totalInstances / rowsPerPage)}
              onChange={(event, page) => {setCurrentPage(page)}}
            />
          </div>
      </Title>
    </>
  );
}