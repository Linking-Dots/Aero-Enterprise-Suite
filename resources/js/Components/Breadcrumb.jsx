import React from 'react';
import { Chip, Breadcrumbs } from '@heroui/react';
import { HomeIcon } from '@heroicons/react/24/outline';
import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';

// Custom Breadcrumb Item Component with glassmorphism styling
const StyledBreadcrumb = ({ label, icon, onClick, href, isActive, ...props }) => {
  const baseClasses = `
    backdrop-blur-md bg-white/10 dark:bg-black/10
    border border-white/20 dark:border-white/10
    h-8 px-3 py-1
    text-sm font-medium text-foreground
    rounded-lg
    transition-all duration-300
    hover:bg-white/20 dark:hover:bg-black/20
    hover:cursor-pointer
    active:shadow-md active:bg-white/20 dark:active:bg-black/20
    ${isActive ? 'bg-primary/20 text-primary' : ''}
  `;

  const content = (
    <>
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseClasses} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <div className={baseClasses} onClick={onClick} {...props}>
      {content}
    </div>
  );
};


const Breadcrumb = ({ }) => {
    const {props} = usePage();
    const {title, auth, job} = props;
    
    // Generate breadcrumb items based on current route
    const generateBreadcrumbs = () => {
        const currentRoute = route().current();
        const breadcrumbs = [];

        // Add home breadcrumb with fallback
        try {
            breadcrumbs.push({
                label: "Home",
                icon: <HomeIcon className="w-4 h-4" />,
                href: route('dashboard'),
                component: "a"
            });
        } catch (error) {
            // Fallback if dashboard route doesn't exist
            breadcrumbs.push({
                label: "Home",
                icon: <HomeIcon className="w-4 h-4" />,
                href: "/",
                component: "a"
            });
        }

        try {
            // Handle different route patterns
            if (currentRoute?.startsWith('hr.recruitment')) {
                // Add HR Recruitment base breadcrumb
                breadcrumbs.push({
                    label: "Recruitment",
                    href: route('hr.recruitment.index'),
                    component: Link
                });

                // Handle specific recruitment routes
                if (currentRoute === 'hr.recruitment.show' && job) {
                    breadcrumbs.push({
                        label: job.title || 'Job Details',
                        href: null, // Current page, no link
                        component: "span"
                    });
                } else if (currentRoute === 'hr.recruitment.applications.index' && job) {
                    // Only add job link if we have a valid job ID
                    if (job.id) {
                        breadcrumbs.push({
                            label: job.title || 'Job',
                            href: route('hr.recruitment.show', { id: job.id }),
                            component: Link
                        });
                    }
                    breadcrumbs.push({
                        label: "Applications",
                        href: null, // Current page, no link
                        component: "span"
                    });
                } else if (currentRoute === 'hr.recruitment.create') {
                    breadcrumbs.push({
                        label: "Create Job",
                        href: null, // Current page, no link
                        component: "span"
                    });
                } else if (currentRoute === 'hr.recruitment.edit' && job && job.id) {
                    breadcrumbs.push({
                        label: job.title || 'Job',
                        href: route('hr.recruitment.show', { id: job.id }),
                        component: Link
                    });
                    breadcrumbs.push({
                        label: "Edit",
                        href: null, // Current page, no link
                        component: "span"
                    });
                }
            } else if (currentRoute === 'profile' && auth?.user?.id) {
                breadcrumbs.push({
                    label: title || 'Profile',
                    href: route('profile', { user: auth.user.id }),
                    component: Link
                });
            } else {
                // Default fallback - just add the title without trying to generate route
                breadcrumbs.push({
                    label: title || 'Page',
                    href: null, // Current page, no link
                    component: "span"
                });
            }
        } catch (error) {
            // Fallback in case of any route generation errors
            console.warn('Breadcrumb route generation error:', error);
            breadcrumbs.push({
                label: title || 'Page',
                href: null,
                component: "span"
            });
        }

        return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumbs();

    return (
        <div className="flex justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
            >
                <div className="w-full">
                    <div className="flex justify-between items-center">
                        <div>
                            <Breadcrumbs
                                separator="/"
                                classNames={{
                                    list: "flex flex-wrap items-center gap-1",
                                    separator: "text-default-400 mx-1"
                                }}
                            >
                                {breadcrumbs.map((breadcrumb, index) => (
                                    <StyledBreadcrumb
                                        key={index}
                                        href={breadcrumb.href}
                                        label={breadcrumb.label}
                                        icon={breadcrumb.icon}
                                        isActive={index === breadcrumbs.length - 1}
                                        onClick={breadcrumb.href ? undefined : (e) => e.preventDefault()}
                                        style={breadcrumb.href ? {} : { cursor: 'default', opacity: 0.8 }}
                                    />
                                ))}
                            </Breadcrumbs>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Breadcrumb;
