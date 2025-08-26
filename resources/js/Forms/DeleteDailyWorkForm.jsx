import { Button, Spinner } from "@heroui/react";
import GlassDialog from "@/Components/GlassDialog.jsx";
import React from "react";
import { toast } from "react-toastify";


const DeleteDailyWorkForm = ({ open, handleClose, handleDelete }) => {



    return(
        <GlassDialog
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {"Confirm Deletion"}
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    Are you sure you want to delete this task? This action cannot be undone.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Cancel
                </Button>
                <Button onClick={handleDelete} color="error" autoFocus>
                    Delete
                </Button>
            </DialogActions>
        </GlassDialog>

    );
}


export default DeleteDailyWorkForm;
