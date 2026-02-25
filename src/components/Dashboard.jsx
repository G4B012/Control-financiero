import React from 'react';
import RowInput from './RowInput';

const Dashboard = () => {
    return (
        <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <RowInput className="text-right" />
                <RowInput className="text-right" />
                <RowInput className="text-right" />
                {/* Add other components or RowInput as needed */}
            </div>
        </div>
    );
};

export default Dashboard;