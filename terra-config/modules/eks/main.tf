# ── EKS Control Plane
resource "aws_eks_cluster" "main" {
  name     = var.cluster_name
  version  = var.cluster_version
  role_arn = var.cluster_role_arn

  vpc_config {
    subnet_ids = concat(
      var.private_subnet_ids,
      var.public_subnet_ids
    )
    endpoint_private_access = true
    endpoint_public_access  = true
  }

  tags = { Name = var.cluster_name }
}

# Get correct EKS AMI
data "aws_ssm_parameter" "eks_ami" {
  name = "/aws/service/eks/optimized-ami/${var.cluster_version}/amazon-linux-2/recommended/image_id"
}

# Launch Template
resource "aws_launch_template" "nodes" {
  name_prefix   = "${var.cluster_name}-nodes-"
  image_id      = data.aws_ssm_parameter.eks_ami.value
  instance_type = var.node_instance_type

  user_data = base64encode(<<-EOF
    #!/bin/bash
    set -ex
    /etc/eks/bootstrap.sh '${var.cluster_name}'
  EOF
  )

  vpc_security_group_ids = [
    aws_eks_cluster.main.vpc_config[0].cluster_security_group_id
  ]

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      delete_on_termination = true
    }
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.cluster_name}-node"
    }
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [aws_eks_cluster.main]
}

# EKS Node Group
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.cluster_name}-nodes"
  node_role_arn   = var.node_role_arn
  subnet_ids      = var.private_subnet_ids

  # Do NOT specify ami_type or instance_types here when using launch template
  # The launch template controls those settings

  launch_template {
    id      = aws_launch_template.nodes.id
    version = aws_launch_template.nodes.latest_version
  }

  scaling_config {
    desired_size = var.node_desired_size
    min_size     = var.node_min_size
    max_size     = var.node_max_size
  }

  update_config {
    max_unavailable = 1
  }

  timeouts {
    create = "60m"
    update = "60m"
    delete = "60m"
  }

  tags = { Name = "${var.cluster_name}-node-group" }

  depends_on = [
    aws_eks_cluster.main,
    aws_launch_template.nodes
  ]
}