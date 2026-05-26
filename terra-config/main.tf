# Module 1: VPC
# Builds your private network — subnets, gateways, routing tables
module "vpc" {
  source = "./modules/vpc"

  cluster_name         = var.cluster_name
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

# Module 2: IAM
# Creates the permission roles EKS needs to talk to other AWS services
module "iam" {
  source = "./modules/iam"

  cluster_name = var.cluster_name
}

# Module 3: EKS
# Creates the Kubernetes cluster and the EC2 worker nodes inside it
# Notice how it receives vpc_id and subnet_ids FROM the vpc module output
module "eks" {
  source = "./modules/eks"

  cluster_name       = var.cluster_name
  cluster_version    = var.cluster_version
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids
  cluster_role_arn   = module.iam.cluster_role_arn
  node_role_arn      = module.iam.node_role_arn
  node_instance_type = var.node_instance_type
  node_desired_size  = var.node_desired_size
  node_min_size      = var.node_min_size
  node_max_size      = var.node_max_size
}

# Module 4: ECR
# Creates two private Docker image registries on AWS
# One for your frontend image, one for your backend image
module "ecr" {
  source = "./modules/ecr"

  frontend_name = var.ecr_frontend_name
  backend_name  = var.ecr_backend_name
}