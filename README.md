# Firestream Real-Time Game Analytics Pipeline

This repository contains a real-time analytics pipeline designed to process and store game telemetry data, such as player events (kills, wins, items collected), using a scalable architecture powered by **AWS Kinesis**, **AWS CDK**, **Golang**, and **PostgreSQL**. The pipeline enables real-time leaderboards, providing up-to-date insights into player performance.

## Tech Stack

- **AWS Kinesis**: A scalable streaming pipeline for collecting and processing player events in real-time.
- **AWS CDK**: Infrastructure as Code (IaC) for deploying and managing AWS resources.
- **Golang**: Backend service for processing player events and interacting with Kinesis and PostgreSQL.
- **PostgreSQL**: Relational database to store game telemetry and leaderboard.

## Features

- **Real-time Event Collection**: Capture game telemetry events such as kills, wins, and items collected.
- **Event Processing**: Process events in real-time to update leaderboards and other analytics.
- **Real-time Leaderboards**: Display up-to-date player rankings based on collected telemetry data.
- **Scalable Architecture**: Utilize AWS Kinesis for efficient stream processing and AWS services for scalability.
