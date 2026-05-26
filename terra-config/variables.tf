variable "aws_region" {
  description = "AWS region where all resources will be created"
  type        = string
  default     = "ca-central-1"
}

variable "environment" {
  description = "Environment label (dev / staging / prod)"
  type        = string
  default     = "dev"
}

variable "cluster_name" {
  description = "Name of the EKS Kubernetes cluster"
  type        = string
  default     = "jobboard-cluster"
}

variable "cluster_version" {
  description = "Kubernetes version for the EKS cluster"
  type        = string
  default     = "1.32"
}

variable "vpc_cidr" {
  description = "IP address range for the entire VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Two AZs in ca-central-1 for high availability"
  type        = list(string)
  default     = ["ca-central-1a", "ca-central-1b"]
}

variable "public_subnet_cidrs" {
  description = "IP ranges for public subnets — one per AZ"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "IP ranges for private subnets — one per AZ"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "node_instance_type" {
  description = "EC2 instance type for EKS worker nodes"
  type        = string
  # t3.small = 2 vCPU, 2GB RAM — enough for your job board
  default     = "t3.small"
}

variable "node_desired_size" {
  description = "How many worker nodes to run normally"
  type        = number
  default     = 1
}

variable "node_min_size" {
  description = "Minimum worker nodes"
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Maximum worker nodes"
  type        = number
  default     = 2
}

variable "ecr_frontend_name" {
  description = "ECR repository name for the React frontend image"
  type        = string
  default     = "jobboard-frontend"
}

variable "ecr_backend_name" {
  description = "ECR repository name for the Node.js backend image"
  type        = string
  default     = "jobboard-backend"
}