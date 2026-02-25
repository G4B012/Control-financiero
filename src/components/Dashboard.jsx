import React from 'react';
import { Card, Row } from 'reactstrap';

const Dashboard = () => {
    return (
        <div>
            <Card className="card-body space-y-3">
                <Row>
                    <input type="text" className="RowInput" placeholder="Search..." />
                </Row>
                <Row className="text-right">
                    <Card body>
                        <h5>Your Title</h5>
                    </Card>
                </Row>
            </Card>
        </div>
    );
};

export default Dashboard;