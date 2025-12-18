<?php

namespace App\Policies;

use App\Models\DailyWork;
use App\Models\RfiObjection;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class RfiObjectionPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any objections.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('daily-works.view');
    }

    /**
     * Determine whether the user can view the objection.
     */
    public function view(User $user, RfiObjection $objection): bool
    {
        if (! $user->hasPermissionTo('daily-works.view')) {
            return false;
        }

        // Admins can view any objection
        if ($this->isAdmin($user)) {
            return true;
        }

        // Incharge or assigned user of the related RFI can view
        return $this->isInchargeOrAssignedOfRfi($user, $objection->dailyWork);
    }

    /**
     * Determine whether the user can create objections for an RFI.
     * Only the RFI In-Charge or Assigned Engineer(s) can raise objections.
     */
    public function create(User $user, DailyWork $dailyWork): bool
    {
        // Admins can always create
        if ($this->isAdmin($user)) {
            return true;
        }

        // Only incharge or assigned can create objections
        return $this->isInchargeOrAssignedOfRfi($user, $dailyWork);
    }

    /**
     * Determine whether the user can update the objection.
     */
    public function update(User $user, RfiObjection $objection): bool
    {
        // Admins can always update
        if ($this->isAdmin($user)) {
            return true;
        }

        // Only draft objections can be updated by the creator
        if ($objection->status !== RfiObjection::STATUS_DRAFT) {
            return false;
        }

        // Creator can update their own draft objections
        return $objection->created_by === $user->id;
    }

    /**
     * Determine whether the user can delete the objection.
     */
    public function delete(User $user, RfiObjection $objection): bool
    {
        // Admins can delete any
        if ($this->isAdmin($user)) {
            return true;
        }

        // Only draft objections can be deleted by the creator
        if ($objection->status !== RfiObjection::STATUS_DRAFT) {
            return false;
        }

        return $objection->created_by === $user->id;
    }

    /**
     * Determine whether the user can submit the objection.
     */
    public function submit(User $user, RfiObjection $objection): bool
    {
        // Only draft objections can be submitted
        if ($objection->status !== RfiObjection::STATUS_DRAFT) {
            return false;
        }

        // Admins can submit any
        if ($this->isAdmin($user)) {
            return true;
        }

        // Only creator can submit
        return $objection->created_by === $user->id;
    }

    /**
     * Determine whether the user can review the objection (start review, resolve, reject).
     */
    public function review(User $user, RfiObjection $objection): bool
    {
        if (! $user->hasPermissionTo('daily-works.update')) {
            return false;
        }

        // Only submitted or under_review objections can be reviewed
        if (! in_array($objection->status, [RfiObjection::STATUS_SUBMITTED, RfiObjection::STATUS_UNDER_REVIEW])) {
            return false;
        }

        // Admins and managers can review
        return $this->isAdmin($user) || $this->isManager($user);
    }

    /**
     * Determine whether the user can upload files to the objection.
     */
    public function uploadFiles(User $user, RfiObjection $objection): bool
    {
        // Admins can always upload
        if ($this->isAdmin($user)) {
            return true;
        }

        // Only for draft or submitted objections
        if (! in_array($objection->status, [RfiObjection::STATUS_DRAFT, RfiObjection::STATUS_SUBMITTED])) {
            return false;
        }

        // Creator or incharge/assigned can upload files
        return $objection->created_by === $user->id || $this->isInchargeOrAssignedOfRfi($user, $objection->dailyWork);
    }

    /**
     * Determine whether the user can delete files from the objection.
     */
    public function deleteFiles(User $user, RfiObjection $objection): bool
    {
        return $this->uploadFiles($user, $objection);
    }

    /**
     * Check if user is an admin.
     */
    protected function isAdmin(User $user): bool
    {
        return $user->hasRole(['Super Admin', 'Admin', 'HR Manager']);
    }

    /**
     * Check if user is a manager (can review objections).
     */
    protected function isManager(User $user): bool
    {
        return $user->hasRole(['Super Admin', 'Admin', 'Project Manager', 'Consultant', 'HR Manager']);
    }

    /**
     * Check if user is incharge of the RFI.
     */
    protected function isIncharge(User $user, DailyWork $dailyWork): bool
    {
        return $dailyWork->incharge === $user->id;
    }

    /**
     * Check if user is assigned to the RFI.
     */
    protected function isAssigned(User $user, DailyWork $dailyWork): bool
    {
        return $dailyWork->assigned === $user->id;
    }

    /**
     * Check if user is either incharge or assigned to the RFI.
     */
    protected function isInchargeOrAssignedOfRfi(User $user, DailyWork $dailyWork): bool
    {
        return $this->isIncharge($user, $dailyWork) || $this->isAssigned($user, $dailyWork);
    }
}
