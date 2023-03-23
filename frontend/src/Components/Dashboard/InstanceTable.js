//Lists all instances
import React, { useEffect } from 'react';
import { useHistory } from "react-router-dom";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Title from './Title';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Tooltip from '@material-ui/core/Tooltip';
import InstanceApiService from '../../Services/instance-api-service';
import {textTrim, SearchBar} from '../../Util.js'
import Pagination from '@material-ui/lab/Pagination';
import TableContainer from '@material-ui/core/TableContainer';
import Checkbox from '@material-ui/core/Checkbox';
import Toolbar from '@material-ui/core/Toolbar';
import clsx from 'clsx';
import Typography from '@material-ui/core/Typography';
import Chip from '@material-ui/core/Chip';
import CodeIcon from '@material-ui/icons/Code';
import {UnControlled as CodeMirror} from 'react-codemirror2';
import LockIcon from '@material-ui/icons/Lock';
import TextField from '@material-ui/core/TextField';
import Popover from '@material-ui/core/Popover';
import useStyles from '../../styles.js';
import { InstanceTableHeader } from './InstanceTableHeader.js';
import 'codemirror/addon/edit/matchbrackets.js'
import 'codemirror/addon/edit/closebrackets.js'
import 'codemirror/addon/selection/active-line.js'

export default function InstanceTable(props) {
  const classes = useStyles();
  let history = useHistory();

  const [open, setOpen] = React.useState(false);
  const [instancesPerPage, setInstancesPerPage] = React.useState(10);
  const [expanded, setExpanded] = React.useState(false);
  const [selected, setSelected] = React.useState([]);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [popText, setPopText] = React.useState('Click To Copy')
  
  const isInstanceSelected = (id) => selected.indexOf(id) !== -1;
  const popoverOpen = Boolean(anchorEl);

  const runInstance = (id) => {
    return "!!run " + id
  }

  const handleExpandClick = (id) => {
    setExpanded(id);
  };

  const handleClickOpen = () => {
    setOpen(true);
    // setInstanceToDelete(id);
  };

  const handleClose = () => {
    setOpen(false);
    // setInstanceToDelete(undefined);
  };

  const handleSelectAllClick = (event, id) => {
    if (event.target.checked) {
      const newSelecteds = props.instances
        .map((instance) => {
          return instance.id
        })
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClickRow = (event, instance) => {
    const name = instance.id
    const selectedIndex = selected.indexOf(name);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = props.orderBy.toLowerCase() === property.toLowerCase() && props.sortDirection === 'asc';
    props.setSortDirection(isAsc ? 'desc' : 'asc');
    props.setOrderBy(property.toLowerCase());
  };

  const updateInstance = (instance) => {
    let payload = instance

    InstanceApiService.updateInstance(payload, instance.id)
      .then((instance) => {
        props.onChange(instance)
      })
  }

  function deleteAllSelected() {
    InstanceApiService.deleteInstances(selected)
      .then(res => {
        // Re-request current page of instances
        props.setRefresh(Math.random())
        setSelected([])
      })
  }
  
  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setPopText('Click To Copy')
  }

  return (
    props.instances ?
    <React.Fragment>
      <div className={classes.headBar}>
        <div className={classes.headLeft}></div>
        <div className={classes.headTitle}>My Instances</div>
        <div className={classes.headRight}><SearchBar setSearch={props.setSearch} /></div>
      </div>
      <Toolbar
        className={clsx(classes.instanceTableRoot, {
          [classes.highlight]: selected.length > 0,
        })}
      >
        {selected.length > 0 ? (
          <>
          <Tooltip title="Delete">
            <IconButton aria-label="delete" onClick={handleClickOpen}> 
              <DeleteForeverIcon 
                // onClick={deleteAllSelected}
              />
            </IconButton>
          </Tooltip>
            <Dialog 
              open={open}
              // open={instanceToDelete === instance.id}
              onClose={() => handleClose()}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
            >
              <DialogTitle id="alert-dialog-title">{"Delete instance?"}</DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  Are you sure you would like to delete this instance?
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => {handleClose(); deleteAllSelected()}} color="secondary">
                  Delete
                </Button>
                <Button onClick={handleClose} color="primary" autoFocus>
                  Keep
                </Button>
              </DialogActions>
            </Dialog>
          </>
        ) : (
          <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
          </Typography>
        )}
        {selected.length > 0 ? (
          <Typography className={classes.title} color="inherit" variant="subtitle1" component="div">
            {selected.length} selected
          </Typography>
        ) : (
          <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
          </Typography>
        )}
      </Toolbar>
      <TableContainer className={classes.container}>
        <Table size='small' padding='none' stickyHeader aria-label="sticky table"> 
          <InstanceTableHeader
            classes={classes}
            numSelected={selected.length}
            sortDirection={props.sortDirection}
            orderBy={props.orderBy}
            onSelectAllClick={handleSelectAllClick}
            onRequestSort={handleRequestSort}
            instances={props.instances}
            instancesPerPage={instancesPerPage}
          />
          <TableBody>
            {props.instances.map((instance) => (
              <TableRow 
                hover 
                key={"Key: " + instance.id}
                onClick={(event) => handleClickRow(event, instance)}
                selected={selected.indexOf(instance.id) !== -1}
              >
                <TableCell padding="checkbox">
                  {instance.locked ?
                  ''
                  :
                  <Checkbox
                    checked={isInstanceSelected(instance.id)}
                  />
                  }
                </TableCell>
                <Tooltip title={new Date(Date.parse(instance.date_created)).toLocaleTimeString()} arrow placement="bottom-start">
                  <TableCell>{new Date(Date.parse(instance.date_created)).toLocaleDateString()}</TableCell>
                </Tooltip>
                <Tooltip title={new Date(Date.parse(instance.date_modified)).toLocaleTimeString()} arrow placement="bottom-start">
                  <TableCell>{new Date(Date.parse(instance.date_modified)).toLocaleDateString()}</TableCell>
                </Tooltip>
                <TableCell>{textTrim(instance.name, 15)}</TableCell>
                <TableCell>{textTrim(instance.description, 30)}</TableCell>
                <TableCell width='40%'>{instance.tags.length ? 
                  instance.tags.map(t => (
                    <Chip
                      key={t.id}
                      variant="outlined"
                      size="small"
                      label={t.name}
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    />
                  )) : ''}
                </TableCell>
                <TableCell className={classes.icons}>
                  <IconButton
                    className={clsx(classes.expand, {
                      [classes.expandOpen]: expanded == instance.id,
                    })}
                    onClick={(event) => {
                      handleExpandClick(instance.id)
                      event.stopPropagation();
                    }}
                    aria-expanded={expanded == instance.id}
                    aria-label="show more"
                  >
                    <Tooltip title="View Code" placement="top">
                      <CodeIcon />
                    </Tooltip>
                  </IconButton>
                  <Dialog
                    open={expanded == instance.id}
                    onClose={(event) => {
                      handleExpandClick(false)
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                  >
                    <div className={classes.cardHead}>
                      <DialogTitle id="alert-dialog-title">{`${instance.name}`}</DialogTitle>
                    </div>
                    <div className={classes.cardHead}>
                      <TextField
                        size="small"
                        className={classes.copy}
                        id="read-only-twitch-command"
                        label="Twitch Dictum"
                        defaultValue= {runInstance(instance.id)}
                        InputProps={{
                          readOnly: true,
                        }}
                        variant="outlined"
                        aria-owns={popoverOpen ? 'mouse-over-popover' : undefined}
                        aria-haspopup="true"
                        onMouseEnter={handlePopoverOpen}
                        onMouseLeave={handlePopoverClose}
                        onClick={() => {
                          navigator.clipboard.writeText(runInstance(instance.id))
                          setPopText('Copied!')
                        }}
                      />
                      <Popover
                        id="mouse-over-popover"
                        className={classes.popover}
                        classes={{
                          paper: classes.paper,
                        }}
                        open={popoverOpen}
                        anchorEl={anchorEl}
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'left',
                        }}
                        transformOrigin={{
                          vertical: 'top',
                          horizontal: 'left',
                        }}
                        onClose={handlePopoverClose}
                        disableRestoreFocus
                      >
                        <Typography>{popText}</Typography>
                      </Popover>
                    </div>
                    <DialogContent className="dialogBox">
                      <DialogContentText id="CodeMirror-Display">
                        <CodeMirror
                          className={classes.codeMirror}
                          value={instance.text}
                          options={{
                            lineWrapping: true,
                            mode: 'scheme',
                            theme: 'material',
                            lineNumbers: true,
                            matchBrackets: true,
                            autoCloseBrackets: true,
                            styleActiveLine: true,
                          }}
                        />
                      </DialogContentText>
                      Edited code will not be saved
                    </DialogContent>
                  </Dialog>
                </TableCell>
                <>
                {instance.locked ? 
                  <>
                    <TableCell className={classes.icons}></TableCell>
                    <TableCell className={classes.icons}>
                      <LockIcon />
                    </TableCell>
                  </>
                  :
                  <>
                  <TableCell className={classes.icons}>
                    <IconButton aria-label="edit" onClick={() => history.push(`/instances/${instance.id}`)}>
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell className={classes.icons}>
                    <IconButton 
                    id={instance.id} 
                    aria-label="isPublic" 
                    onClick={(event) => {
                      updateInstance({...instance, is_public: !instance.is_public});
                      event.stopPropagation();
                    }}>
                      {instance.is_public ? <VisibilityIcon /> : <VisibilityOffIcon />}
                    </IconButton>
                  </TableCell>
                  </>
                }
                </>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* {console.log(props.instances)} */}
        <div className={classes.pagi}>
          <Pagination count={Math.ceil(props.totalInstances / instancesPerPage)}
            onChange={(event, page) => {
              props.setCurrentPage(page)
              setSelected([])
            }}
          />
        </div>
    </React.Fragment>
    : ''
  );
}